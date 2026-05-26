import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calculator, Copy, ExternalLink, Play, Search, Trash2 } from "lucide-react";
import type {
  TheoryBadgeCalculatorPayloadV1,
  TheoryBadgeEdgeV1,
  TheoryBadgeEquationV1,
  TheoryBadgeGraphV1,
  TheoryBadgeLevel,
  TheoryBadgeSourceRefV1,
  TheoryBadgeUnitV1,
  TheoryBadgeV1,
} from "@shared/contracts/theory-badge-graph.v1";
import type {
  TheoryBadgePlaybackArtifactV1,
  TheoryBadgePlaybackStepV1,
} from "@shared/contracts/theory-badge-playback.v1";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import StellarEvolutionLens from "@/components/panels/StellarEvolutionLens";
import TheoryAchievementMap from "@/components/panels/TheoryAchievementMap";
import TheoryAtlasRail, { type TheoryAtlasLensId } from "@/components/panels/TheoryAtlasRail";
import { dispatchScientificCalculatorMathPicked } from "@/lib/scientific-calculator/events";
import { resolveTheoryBadgeConnectionTrace } from "@/lib/theory/theoryBadgeConnectionTrace";
import { resolveTheoryBadgePlaybackPlan } from "@/lib/theory/theoryBadgePlaybackPlan";
import { formatTheoryBadgePlaybackMarkdown } from "@/lib/theory/theoryBadgePlaybackRunner";
import { buildTheoryBadgeLocatorArtifact } from "@/lib/theory/theoryMapOverlay";
import { useScientificCalculatorStore } from "@/store/useScientificCalculatorStore";
import { useTheoryBadgeGraphPanelStore } from "@/store/useTheoryBadgeGraphPanelStore";
import { useTheoryBadgePlaybackStore } from "@/store/useTheoryBadgePlaybackStore";
import { useTheoryMapOverlayStore } from "@/store/useTheoryMapOverlayStore";
import {
  STARSIM_STELLAR_EVOLUTION_STAGES,
  type StarSimStellarEvolutionStage,
  type StarSimStellarEvolutionStageId,
} from "@shared/theory/starsim-stellar-evolution-map";

const LEVEL_ORDER = [
  "first_principle",
  "law",
  "derived_relation",
  "model",
  "simulation_specific",
  "diagnostic_gate",
  "claim_boundary",
] as const satisfies readonly TheoryBadgeLevel[];

function labelize(value: string) {
  return value.replace(/_/g, " ");
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a: string, b: string) => a.localeCompare(b));
}

async function copyText(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(value);
  }
}

function statusClass(status: string) {
  switch (status) {
    case "running":
      return "border-cyan-500 bg-cyan-950/40 text-cyan-100";
    case "solved":
      return "border-emerald-500 bg-emerald-950/40 text-emerald-100";
    case "failed":
      return "border-rose-500 bg-rose-950/40 text-rose-100";
    case "skipped":
      return "border-slate-700 bg-slate-900/70 text-slate-300";
    default:
      return "border-slate-800 bg-slate-950/70 text-slate-500";
  }
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
  playback,
  onRunPlayback,
  onClearPlayback,
  playbackStatus,
}: {
  badge: TheoryBadgeV1 | null;
  graph: TheoryBadgeGraphV1 | undefined;
  onSelect: (id: string) => void;
  playback: TheoryBadgePlaybackArtifactV1 | null;
  onRunPlayback: () => void;
  onClearPlayback: () => void;
  playbackStatus: "idle" | "running" | "complete" | "failed";
}) {
  const byId = useMemo(
    () =>
      new Map<string, TheoryBadgeV1>(
        (graph?.badges ?? []).map((item: TheoryBadgeV1) => [item.id, item]),
      ),
    [graph?.badges],
  );
  const relatedEdges = useMemo(
    () =>
      (graph?.edges ?? []).filter(
        (edge: TheoryBadgeEdgeV1) => edge.from === badge?.id || edge.to === badge?.id,
      ),
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
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="flex flex-wrap gap-1">
              <Badge className="bg-cyan-900/80 text-cyan-50">{labelize(badge.level)}</Badge>
              <Badge variant="outline" className="border-slate-700 text-slate-300">
                {labelize(badge.status)}
              </Badge>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={onRunPlayback}
              disabled={playbackStatus === "running"}
              className="gap-2 bg-cyan-700 text-white hover:bg-cyan-600"
            >
              <Play className="h-4 w-4" />
              Run Path to Badge
            </Button>
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
            {badge.equations.map((equation: TheoryBadgeEquationV1) => (
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
              badge.units.map((unit: TheoryBadgeUnitV1) => (
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
            {badge.assumptions.map((assumption: string) => (
              <li key={assumption}>- {assumption}</li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Calculator Payloads</h3>
          <div className="mt-2 space-y-2">
            {badge.calculatorPayloads.length > 0 ? (
              badge.calculatorPayloads.map((payload: TheoryBadgeCalculatorPayloadV1) => (
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
            {badge.sourceRefs.map((source: TheoryBadgeSourceRefV1, index: number) => (
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
              relatedEdges.map((edge: TheoryBadgeEdgeV1) => (
                <RelatedBadgeRow key={edge.id} edge={edge} selectedId={badge.id} byId={byId} onSelect={onSelect} />
              ))
            ) : (
              <div className="text-sm text-slate-500">No related edges for this badge.</div>
            )}
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Path Playback</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!playback}
                onClick={() => playback && copyText(JSON.stringify(playback, null, 2))}
                className="gap-2 border-slate-700"
              >
                <Copy className="h-4 w-4" />
                Copy Playback JSON
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!playback}
                onClick={() => playback && copyText(formatTheoryBadgePlaybackMarkdown(playback))}
                className="gap-2 border-slate-700"
              >
                <Copy className="h-4 w-4" />
                Copy Playback Markdown
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={!playback}
                onClick={onClearPlayback}
                className="gap-2 text-slate-300"
              >
                <Trash2 className="h-4 w-4" />
                Clear Playback
              </Button>
            </div>
          </div>
          {playback ? (
            <div className="mt-3 space-y-2">
              <div className="grid gap-2 text-xs text-slate-400 sm:grid-cols-5">
                <div>Badges: {playback.summary.badgeCount}</div>
                <div>Payloads: {playback.summary.payloadCount}</div>
                <div>Solved: {playback.summary.solvedCount}</div>
                <div>Skipped: {playback.summary.skippedCount}</div>
                <div>Failed: {playback.summary.failedCount}</div>
              </div>
              {playback.steps.map((step: TheoryBadgePlaybackStepV1) => (
                <div key={step.id} className={`rounded-md border p-3 text-sm ${statusClass(step.status)}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-semibold">
                      {step.index}. {step.badgeTitle}
                    </div>
                    <Badge variant="outline" className="border-current text-[10px]">
                      {step.status}
                    </Badge>
                  </div>
                  <div className="mt-1 font-mono text-xs opacity-80">
                    {step.payloadId ?? `skipped: ${step.skipReason ?? "unknown"}`}
                  </div>
                  {step.expression ? <div className="mt-2 font-mono text-xs opacity-90">{step.expression}</div> : null}
                  <div className="mt-2 grid gap-1 text-xs opacity-90 sm:grid-cols-4">
                    <div>kind: {step.resultKind ?? "-"}</div>
                    <div>confidence: {step.confidence ?? "-"}</div>
                    <div>fallback: {step.fallbackReason ?? "-"}</div>
                    <div>artifact: {step.calculatorArtifactV1 ? "yes" : "no"}</div>
                  </div>
                  {step.resultText ? <div className="mt-2 text-xs opacity-95">result: {step.resultText}</div> : null}
                  {step.warnings.length > 0 ? (
                    <div className="mt-2 text-xs opacity-90">warnings: {step.warnings.join("; ")}</div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 rounded-md border border-slate-800 bg-slate-900/50 p-3 text-sm text-slate-500">
              No playback run yet.
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

export default function TheoryBadgeGraphPanel() {
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("all");
  const [level, setLevel] = useState("all");
  const [status, setStatus] = useState("all");
  const [selectedEvolutionStageId, setSelectedEvolutionStageId] =
    useState<StarSimStellarEvolutionStageId | null>(null);
  const selectedId = useTheoryBadgeGraphPanelStore((state) => state.selectedBadgeId);
  const selectedBadgeIds = useTheoryBadgeGraphPanelStore((state) => state.selectedBadgeIds);
  const viewport = useTheoryBadgeGraphPanelStore((state) => state.viewport);
  const activeLensId = useTheoryBadgeGraphPanelStore((state) => state.activeAtlasLensId);
  const setSelectedBadgeId = useTheoryBadgeGraphPanelStore((state) => state.setSelectedBadgeId);
  const setSelectedBadgeIds = useTheoryBadgeGraphPanelStore((state) => state.setSelectedBadgeIds);
  const toggleSelectedBadgeId = useTheoryBadgeGraphPanelStore((state) => state.toggleSelectedBadgeId);
  const rememberViewport = useTheoryBadgeGraphPanelStore((state) => state.rememberViewport);
  const setActiveAtlasLensId = useTheoryBadgeGraphPanelStore((state) => state.setActiveAtlasLensId);
  const mapOverlay = useTheoryMapOverlayStore();
  const setLocatorOverlay = useTheoryMapOverlayStore((state) => state.setLocatorOverlay);
  const setSelectionOverlay = useTheoryMapOverlayStore((state) => state.setSelectionOverlay);
  const playbackStore = useTheoryBadgePlaybackStore();
  const calculatorLatex = useScientificCalculatorStore((state) => state.currentLatex);
  const calculatorArtifact = useScientificCalculatorStore((state) => state.lastArtifactV1);

  const { data: graph, isLoading, error } = useQuery<TheoryBadgeGraphV1>({
    queryKey: ["/api/helix/theory/graph"],
  });

  const subjects = useMemo(
    () => uniqueSorted((graph?.badges ?? []).flatMap((badge: TheoryBadgeV1) => badge.subjects)),
    [graph?.badges],
  );
  const levels = useMemo(
    () => uniqueSorted((graph?.badges ?? []).map((badge: TheoryBadgeV1) => badge.level)),
    [graph?.badges],
  );
  const statuses = useMemo(
    () => uniqueSorted((graph?.badges ?? []).map((badge: TheoryBadgeV1) => badge.status)),
    [graph?.badges],
  );

  const filteredBadges = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (graph?.badges ?? []).filter((badge: TheoryBadgeV1) => {
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
    return LEVEL_ORDER.map((levelName: TheoryBadgeLevel) => ({
      level: levelName,
      badges: filteredBadges.filter((badge: TheoryBadgeV1) => badge.level === levelName),
    })).filter((group: { level: TheoryBadgeLevel; badges: TheoryBadgeV1[] }) => group.badges.length > 0);
  }, [filteredBadges]);

  useEffect(() => {
    if (!graph) return;
    if (filteredBadges.length === 0) {
      setSelectedBadgeId(null);
      return;
    }
    if (selectedId && !filteredBadges.some((badge: TheoryBadgeV1) => badge.id === selectedId)) {
      setSelectedBadgeId(null);
    }
  }, [filteredBadges, graph, selectedId, setSelectedBadgeId]);

  useEffect(() => {
    if (!graph) return;
    const expression = calculatorArtifact?.request.inputLatex || calculatorLatex;
    if (!expression.trim()) return;
    const locator = buildTheoryBadgeLocatorArtifact({
      graph,
      input: {
        expression,
        query: expression,
        source: "scientific_calculator",
        limit: 8,
      },
    });
    if (locator.matches.length > 0) setLocatorOverlay(locator);
  }, [calculatorArtifact, calculatorLatex, graph, setLocatorOverlay]);

  const selectedBadge = useMemo(
    () => (graph?.badges ?? []).find((badge: TheoryBadgeV1) => badge.id === selectedId) ?? null,
    [graph?.badges, selectedId],
  );

  const singlePlaybackPlan = useMemo(() => {
    if (!graph || !selectedId || selectedBadgeIds.length > 1) return null;
    return resolveTheoryBadgePlaybackPlan({ graph, targetBadgeId: selectedId });
  }, [graph, selectedBadgeIds.length, selectedId]);

  const multiTrace = useMemo(() => {
    if (!graph || selectedBadgeIds.length < 2) return null;
    return resolveTheoryBadgeConnectionTrace({ graph, badgeIds: selectedBadgeIds });
  }, [graph, selectedBadgeIds]);

  const highlightedBadgeIds =
    multiTrace?.connectingBadgeIds ??
    singlePlaybackPlan?.orderedBadgeIds ??
    mapOverlay.highlightedBadgeIds;
  const highlightedEdgeIds = useMemo(() => {
    if (!graph) return [];
    if (multiTrace) return multiTrace.connectingEdgeIds;
    if (!singlePlaybackPlan && mapOverlay.highlightedEdgeIds.length > 0) return mapOverlay.highlightedEdgeIds;
    const highlighted = new Set(highlightedBadgeIds);
    return graph.edges
      .filter((edge: TheoryBadgeEdgeV1) => highlighted.has(edge.from) && highlighted.has(edge.to))
      .map((edge: TheoryBadgeEdgeV1) => edge.id);
  }, [graph, highlightedBadgeIds, mapOverlay.highlightedEdgeIds, multiTrace, singlePlaybackPlan]);

  const activePlayback =
    playbackStore.activeTargetBadgeId === selectedBadge?.id || playbackStore.activeTargetBadgeId
      ? playbackStore.activeRun
      : null;
  const playbackBadgeIds = activePlayback?.steps.map((step: TheoryBadgePlaybackStepV1) => step.badgeId) ?? [];
  const solvedBadgeIds =
    activePlayback?.steps
      .filter((step: TheoryBadgePlaybackStepV1) => step.status === "solved")
      .map((step: TheoryBadgePlaybackStepV1) => step.badgeId) ?? [];
  const failedBadgeIds =
    activePlayback?.steps
      .filter((step: TheoryBadgePlaybackStepV1) => step.status === "failed")
      .map((step: TheoryBadgePlaybackStepV1) => step.badgeId) ?? [];

  const selectBadge = (badgeId: string) => {
    setSelectedBadgeId(badgeId);
    setSelectedBadgeIds([]);
  };

  const toggleBadgeSelection = (badgeId: string) => {
    toggleSelectedBadgeId(badgeId);
  };

  const loadCalculatorPayload = (badgeId: string, payloadId: string) => {
    const badge = graph?.badges.find((candidate: TheoryBadgeV1) => candidate.id === badgeId);
    const payload = badge?.calculatorPayloads.find(
      (candidate: TheoryBadgeCalculatorPayloadV1) => candidate.id === payloadId,
    );
    if (!badge || !payload) return;
    dispatchScientificCalculatorMathPicked({
      latex: payload.displayLatex || payload.expression,
      sourcePath: `theory://${graph?.graphId ?? "nhm2-theory-badge-graph"}/${badge.id}/${payload.id}`,
      anchor: payload.id,
    });
  };

  const selectEvolutionStage = (stage: StarSimStellarEvolutionStage) => {
    if (!graph) return;
    setSelectedEvolutionStageId(stage.id);
    setSelectedBadgeId(null);
    setSelectedBadgeIds([]);
    const stageBadgeIds = stage.theoryBadgeIds.filter((badgeId: string) =>
      graph.badges.some((badge: TheoryBadgeV1) => badge.id === badgeId),
    );
    const highlighted = new Set(stageBadgeIds);
    const edgeIds = graph.edges
      .filter((edge: TheoryBadgeEdgeV1) => highlighted.has(edge.from) && highlighted.has(edge.to))
      .map((edge: TheoryBadgeEdgeV1) => edge.id);
    setSelectionOverlay({
      selectedBadgeIds: stageBadgeIds,
      highlightedBadgeIds: stageBadgeIds,
      highlightedEdgeIds: edgeIds,
      claimBoundaryNotes: stage.claimBoundaryBadgeIds.map(
        (badgeId: string) => `${badgeId}: Stage 1 reduced-order prior only.`,
      ),
    });
  };

  const runPathToBadge = (badgeId: string) => {
    if (!graph) return;
    void playbackStore.runPlayback({
      graph,
      targetBadgeId: badgeId,
    });
  };

  const toggleAtlasLens = (lensId: TheoryAtlasLensId) => {
    setActiveAtlasLensId(activeLensId === lensId ? null : lensId);
  };

  if (viewMode === "map") {
    return (
      <div className="flex h-full min-h-0 overflow-hidden bg-zinc-900 text-zinc-950">
        <TheoryAtlasRail activeLensId={activeLensId} onSelectLens={toggleAtlasLens} />
        {activeLensId === "starsim-stellar-evolution" && graph ? (
          <StellarEvolutionLens
            graph={graph}
            stages={STARSIM_STELLAR_EVOLUTION_STAGES}
            selectedStageId={selectedEvolutionStageId}
            onSelectStage={selectEvolutionStage}
            onLoadPayload={loadCalculatorPayload}
          />
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col bg-zinc-900">
          <div className="relative min-h-0 flex-1 overflow-hidden bg-zinc-900">
            {isLoading ? (
              <div className="p-4 text-sm text-zinc-200">Loading theory badge graph...</div>
            ) : error ? (
              <div className="p-4 text-sm text-red-200">Theory badge graph failed to load.</div>
            ) : graph ? (
              <>
                <TheoryAchievementMap
                  graph={graph}
                  selectedBadgeId={selectedId}
                  selectedBadgeIds={selectedBadgeIds}
                  highlightedBadgeIds={highlightedBadgeIds}
                  highlightedEdgeIds={highlightedEdgeIds}
                  playbackBadgeIds={playbackBadgeIds}
                  solvedBadgeIds={solvedBadgeIds}
                  failedBadgeIds={failedBadgeIds}
                  rippleBadgeIds={mapOverlay.rippleBadgeIds}
                  heatByBadgeId={mapOverlay.heatByBadgeId}
                  onSelectBadge={selectBadge}
                  onToggleBadgeSelection={toggleBadgeSelection}
                  onRunPath={runPathToBadge}
                  onLoadCalculatorPayload={loadCalculatorPayload}
                  viewport={viewport}
                  onViewportChange={rememberViewport}
                />
                {multiTrace ? (
                  <div className="absolute bottom-3 left-3 right-3 border-2 border-zinc-950 bg-zinc-200 p-3 text-sm shadow-2xl">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-bold">Trace Selected Badges</div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            const target = selectedBadgeIds[selectedBadgeIds.length - 1];
                            if (target) runPathToBadge(target);
                          }}
                        >
                          Run Selected Trace
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setSelectedBadgeIds([])}>
                          Clear Selection
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 grid gap-2 text-xs md:grid-cols-3">
                      <div>Shared ancestors: {multiTrace.sharedAncestorIds.slice(0, 4).join(", ") || "-"}</div>
                      <div>Shared symbols: {multiTrace.sharedSymbols.join(", ") || "-"}</div>
                      <div>Shared units: {multiTrace.sharedUnitSignatures.join(", ") || "-"}</div>
                    </div>
                    {multiTrace.claimBoundaryNotes.length > 0 ? (
                      <div className="mt-2 text-xs text-amber-800">
                        {multiTrace.claimBoundaryNotes.slice(0, 3).join("; ")}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

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
          <div className="flex flex-col items-start gap-2 sm:items-end">
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
            <div className="flex rounded-md border border-slate-800 bg-slate-950 p-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setViewMode("map")}
                className="h-8"
              >
                Achievement Map
              </Button>
              <Button
                type="button"
                size="sm"
                variant={viewMode === "list" ? "secondary" : "ghost"}
                onClick={() => setViewMode("list")}
                className="h-8"
              >
                Inspector List
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(220px,1fr)_180px_180px_180px]">
          <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Search
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                value={query}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
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
              {groupedBadges.map((group: { level: TheoryBadgeLevel; badges: TheoryBadgeV1[] }) => (
                <section key={group.level}>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {labelize(group.level)}
                  </div>
                  <div className="space-y-2">
                    {group.badges.map((badge: TheoryBadgeV1) => (
                      <BadgeButton
                        key={badge.id}
                        badge={badge}
                        selected={badge.id === selectedId}
                        onSelect={() => selectBadge(badge.id)}
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
            <Inspector
              badge={selectedBadge}
              graph={graph}
              onSelect={selectBadge}
              playback={playbackStore.activeTargetBadgeId === selectedBadge?.id ? playbackStore.activeRun : null}
              playbackStatus={playbackStore.status}
              onRunPlayback={() => selectedBadge && runPathToBadge(selectedBadge.id)}
              onClearPlayback={playbackStore.clearPlayback}
            />
          </div>
        </div>
      )}
    </div>
  );
}
