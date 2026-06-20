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
import { isTheoryCompoundRunV1, type TheoryCompoundRunV1 } from "@shared/contracts/theory-compound-run.v1";
import type {
  TheoryBadgePlaybackArtifactV1,
  TheoryBadgePlaybackStepV1,
} from "@shared/contracts/theory-badge-playback.v1";
import {
  PROBABILITY_TERRAIN_SCHEMA_VERSION,
  type ProbabilityTerrainV1,
} from "@shared/contracts/probability-terrain.v1";
import type { TheoryContextReflectionV1 } from "@shared/contracts/theory-context-reflection.v1";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import CasimirCavityLens from "@/components/panels/CasimirCavityLens";
import CosmicDistanceLadderLens from "@/components/panels/CosmicDistanceLadderLens";
import CurvatureCollapseLens from "@/components/panels/CurvatureCollapseLens";
import GalacticDynamicsLens from "@/components/panels/GalacticDynamicsLens";
import PhysicsAtlasBlockLens from "@/components/panels/PhysicsAtlasBlockLens";
import QeiStressEnergyLens from "@/components/panels/QeiStressEnergyLens";
import SolarSpectrumLens from "@/components/panels/SolarSpectrumLens";
import StellarEvolutionLens from "@/components/panels/StellarEvolutionLens";
import TheoryAchievementMap from "@/components/panels/TheoryAchievementMap";
import TheoryAtlasRail, { type TheoryAtlasLensId } from "@/components/panels/TheoryAtlasRail";
import TokamakPlasmaLens from "@/components/panels/TokamakPlasmaLens";
import WarpGrNhm2Lens from "@/components/panels/WarpGrNhm2Lens";
import { dispatchScientificCalculatorMathPicked } from "@/lib/scientific-calculator/events";
import { resolveTheoryBadgeConnectionTrace } from "@/lib/theory/theoryBadgeConnectionTrace";
import { resolveTheoryBadgePlaybackPlan } from "@/lib/theory/theoryBadgePlaybackPlan";
import { formatTheoryBadgePlaybackMarkdown } from "@/lib/theory/theoryBadgePlaybackRunner";
import { buildTheoryBadgeLocatorArtifact } from "@/lib/theory/theoryMapOverlay";
import { resolvePhysicsAtlasLens } from "@shared/theory/physics-atlas-lens";
import { buildHelixPhysicsAtlasV1 } from "@shared/theory/physics-atlas-blocks";
import { buildTheoryCalculatorLoadout } from "@shared/theory/theory-calculator-loadout";
import { buildTheoryCompoundRun } from "@shared/theory/theory-compound-run-builder";
import { traceTheoryFrontierVectorField } from "@shared/theory/theory-frontier-vector-field";
import {
  resolveTheoryRouteEligibility,
  type TheoryRouteBadgeEligibilityV1,
  type TheoryRouteEligibilityResultV1,
} from "@shared/theory/theory-route-eligibility";
import { buildCasimirCavityObjectBindings } from "@shared/theory/casimir-cavity-object-bindings";
import { buildCosmicDistanceObjectBindings } from "@shared/theory/cosmic-distance-object-bindings";
import { buildNhm2DiagnosticObjectBindings } from "@shared/theory/nhm2-diagnostic-object-bindings";
import { buildSolarSpectrumObservationBindings } from "@shared/theory/solar-spectrum-observation-bindings";
import { buildStarSimObjectBindings } from "@shared/theory/starsim-object-bindings";
import { buildTokamakPlasmaObjectBindings } from "@shared/theory/tokamak-plasma-object-bindings";
import { buildGalacticDynamicsObjectBindings } from "@shared/theory/galactic-dynamics-object-bindings";
import { buildCurvatureCollapseObjectBindings } from "@shared/theory/curvature-collapse-object-bindings";
import { useScientificCalculatorStore } from "@/store/useScientificCalculatorStore";
import { useTheoryBadgeGraphPanelStore } from "@/store/useTheoryBadgeGraphPanelStore";
import { useTheoryBadgePlaybackStore } from "@/store/useTheoryBadgePlaybackStore";
import { useTheoryCompoundRunStore } from "@/store/useTheoryCompoundRunStore";
import { useTheoryMapOverlayStore } from "@/store/useTheoryMapOverlayStore";
import { useWorkstationLayoutStore } from "@/store/useWorkstationLayoutStore";
import {
  STARSIM_STELLAR_EVOLUTION_STAGES,
  type StarSimStellarEvolutionStage,
} from "@shared/theory/starsim-stellar-evolution-map";
import {
  COSMIC_DISTANCE_LADDER_RUNGS,
  type CosmicDistanceLadderRung,
} from "@shared/theory/cosmic-distance-ladder-map";
import {
  SOLAR_SPECTRUM_OBSERVATION_GROUPS,
  type SolarSpectrumObservationGroup,
} from "@shared/theory/solar-spectrum-observation-map";
import {
  CASIMIR_CAVITY_GROUPS,
  type CasimirCavityGroup,
} from "@shared/theory/casimir-cavity-map";
import {
  WARP_GR_NHM2_GROUPS,
  type WarpGrNhm2Group,
} from "@shared/theory/warp-gr-nhm2-map";
import {
  QEI_STRESS_ENERGY_GROUPS,
  type QeiStressEnergyGroup,
} from "@shared/theory/qei-stress-energy-map";
import {
  TOKAMAK_PLASMA_GROUPS,
  type TokamakPlasmaGroup,
} from "@shared/theory/tokamak-plasma-map";
import {
  GALACTIC_DYNAMICS_GROUPS,
  type GalacticDynamicsGroup,
} from "@shared/theory/galactic-dynamics-map";
import {
  CURVATURE_COLLAPSE_GROUPS,
  type CurvatureCollapseGroup,
} from "@shared/theory/curvature-collapse-map";

const LEVEL_ORDER = [
  "first_principle",
  "law",
  "derived_relation",
  "model",
  "simulation_specific",
  "diagnostic_gate",
  "claim_boundary",
] as const satisfies readonly TheoryBadgeLevel[];

type TheoryGraphMapMode = "concept" | "execution" | "evidence";
type TheoryCompoundRunMode = "selected_badges" | "dependency_path" | "locator_matches";

type ArtifactRunExpectation = {
  selectedBadgeId?: string;
  activeAtlasLensId?: TheoryAtlasLensId;
  selectedCasimirGroupId?: string;
  selectedWarpGroupId?: string;
  selectedQeiGroupId?: string;
};

const RUNTIME_REFERENCE_OPERATOR_KINDS = [
  "tensor_component",
  "field_sample",
  "region_aggregate",
  "worldline_integral",
  "gate_status",
  "noncomputable_reference",
] as const;

function labelize(value: string) {
  return value.replace(/_/g, " ");
}

function hasRuntimeReferenceEquation(badge: TheoryBadgeV1): boolean {
  return badge.equations.some((equation: TheoryBadgeEquationV1) =>
    RUNTIME_REFERENCE_OPERATOR_KINDS.some((operatorKind) => operatorKind === equation.operatorKind),
  );
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

function firstRouteLabelForMode(decision: TheoryRouteBadgeEligibilityV1, mode: TheoryGraphMapMode): string | null {
  if (mode === "concept") return null;
  if (decision.decision === "blocked") return labelize(decision.reason);
  if (mode === "evidence") {
    if (decision.labels.includes("evidence refs present")) return "evidence";
    if (decision.labels.includes("diagnostic only")) return "diagnostic";
    if (decision.labels.includes("certificate required")) return "certificate required";
    return null;
  }
  if (decision.labels.includes("scalar-solvable")) return "scalar";
  if (decision.labels.includes("runtime entrypoint available")) return "runtime";
  if (decision.labels.includes("tensor/runtime")) return "tensor";
  if (decision.labels.includes("gate")) return "gate";
  if (decision.labels.includes("boundary")) return "boundary";
  if (decision.labels.includes("reference only")) return "reference";
  return null;
}

function routeToneForLabel(decision: TheoryRouteBadgeEligibilityV1, label: string): "cyan" | "emerald" | "amber" | "rose" | "slate" {
  if (decision.decision === "blocked") return "rose";
  if (label === "scalar" || label === "evidence") return "emerald";
  if (label === "runtime" || label === "tensor") return "cyan";
  if (label === "gate" || label === "boundary" || label === "diagnostic" || label === "certificate required") return "amber";
  return "slate";
}

function routeBadgeLabelsForMode(
  eligibility: TheoryRouteEligibilityResultV1 | null,
  mode: TheoryGraphMapMode,
): Record<string, { label: string; tone: "cyan" | "emerald" | "amber" | "rose" | "slate"; title: string }> {
  if (!eligibility || mode === "concept") return {};
  return eligibility.badges.reduce<Record<string, { label: string; tone: "cyan" | "emerald" | "amber" | "rose" | "slate"; title: string }>>(
    (acc, decision) => {
      const label = firstRouteLabelForMode(decision, mode);
      if (!label) return acc;
      acc[decision.badgeId] = {
        label,
        tone: routeToneForLabel(decision, label),
        title: [labelize(decision.reason), ...decision.details, ...decision.labels].filter(Boolean).join(" | "),
      };
      return acc;
    },
    {},
  );
}

function dominantProbabilityId(probabilities: Record<string, number>): string | null {
  const entries = Object.entries(probabilities);
  if (entries.length === 0) return null;
  return entries.sort(([leftId, leftProbability], [rightId, rightProbability]) => {
    const delta = rightProbability - leftProbability;
    return delta !== 0 ? delta : leftId.localeCompare(rightId);
  })[0][0];
}

function placementCertaintyFromReflection(
  reflection: TheoryContextReflectionV1 | null,
): ProbabilityTerrainV1 | undefined {
  const uncertainty = reflection?.overlay.uncertainty;
  if (!uncertainty) return undefined;
  const placementCertainty =
    uncertainty.priorEntropyBits > 0
      ? Math.max(0, Math.min(1, uncertainty.informationGainBits / uncertainty.priorEntropyBits))
      : Object.keys(uncertainty.badgeProbabilityById).length === 1
        ? 1
        : 0;

  return {
    schemaVersion: PROBABILITY_TERRAIN_SCHEMA_VERSION,
    graphKind: "theory_badge_graph",
    candidateProbabilityById: uncertainty.badgeProbabilityById,
    renderChunkProbabilityById: uncertainty.renderChunkProbabilityById,
    semanticChunkProbabilityById: uncertainty.semanticChunkProbabilityById,
    priorEntropyBits: uncertainty.priorEntropyBits,
    posteriorEntropyBits: uncertainty.posteriorEntropyBits,
    informationGainBits: uncertainty.informationGainBits,
    normalizedMass: uncertainty.normalizedMass,
    placementCertainty: Number(placementCertainty.toFixed(6)),
    uncertaintyMode: uncertainty.uncertaintyMode,
    dominantCandidateId: dominantProbabilityId(uncertainty.badgeProbabilityById),
    dominantRenderChunkId: dominantProbabilityId(uncertainty.renderChunkProbabilityById),
    dominantSemanticChunkId: dominantProbabilityId(uncertainty.semanticChunkProbabilityById),
    interpretation: "placement_probability_not_truth_claim",
  };
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
  onLoadTheoryRun,
  onClearPlayback,
  playbackStatus,
}: {
  badge: TheoryBadgeV1 | null;
  graph: TheoryBadgeGraphV1 | undefined;
  onSelect: (id: string) => void;
  playback: TheoryBadgePlaybackArtifactV1 | null;
  onRunPlayback: () => void;
  onLoadTheoryRun: () => void;
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
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onLoadTheoryRun}
              className="gap-2 border-cyan-700 text-cyan-100 hover:bg-cyan-950/50"
            >
              <Calculator className="h-4 w-4" />
              Load Theory Run
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
  const selectedId = useTheoryBadgeGraphPanelStore((state) => state.selectedBadgeId);
  const selectedBadgeIds = useTheoryBadgeGraphPanelStore((state) => state.selectedBadgeIds);
  const viewport = useTheoryBadgeGraphPanelStore((state) => state.viewport);
  const activeLensId = useTheoryBadgeGraphPanelStore((state) => state.activeAtlasLensId);
  const selectedEvolutionStageId = useTheoryBadgeGraphPanelStore((state) => state.selectedStarSimStageId);
  const selectedObjectBindingId = useTheoryBadgeGraphPanelStore((state) => state.selectedStarSimObjectBindingId);
  const selectedCosmicRungId = useTheoryBadgeGraphPanelStore((state) => state.selectedCosmicDistanceRungId);
  const selectedCosmicObjectBindingId = useTheoryBadgeGraphPanelStore(
    (state) => state.selectedCosmicDistanceObjectBindingId,
  );
  const selectedSolarGroupId = useTheoryBadgeGraphPanelStore((state) => state.selectedSolarSpectrumGroupId);
  const selectedSolarObjectBindingId = useTheoryBadgeGraphPanelStore(
    (state) => state.selectedSolarSpectrumObjectBindingId,
  );
  const selectedCasimirGroupId = useTheoryBadgeGraphPanelStore((state) => state.selectedCasimirCavityGroupId);
  const selectedCasimirObjectBindingId = useTheoryBadgeGraphPanelStore(
    (state) => state.selectedCasimirCavityObjectBindingId,
  );
  const selectedWarpGroupId = useTheoryBadgeGraphPanelStore((state) => state.selectedWarpGrNhm2GroupId);
  const selectedWarpObjectBindingId = useTheoryBadgeGraphPanelStore(
    (state) => state.selectedWarpGrNhm2ObjectBindingId,
  );
  const selectedQeiGroupId = useTheoryBadgeGraphPanelStore((state) => state.selectedQeiStressEnergyGroupId);
  const selectedQeiObjectBindingId = useTheoryBadgeGraphPanelStore(
    (state) => state.selectedQeiStressEnergyObjectBindingId,
  );
  const selectedTokamakGroupId = useTheoryBadgeGraphPanelStore((state) => state.selectedTokamakPlasmaGroupId);
  const selectedTokamakObjectBindingId = useTheoryBadgeGraphPanelStore(
    (state) => state.selectedTokamakPlasmaObjectBindingId,
  );
  const selectedGalacticGroupId = useTheoryBadgeGraphPanelStore((state) => state.selectedGalacticDynamicsGroupId);
  const selectedGalacticObjectBindingId = useTheoryBadgeGraphPanelStore(
    (state) => state.selectedGalacticDynamicsObjectBindingId,
  );
  const selectedCurvatureGroupId = useTheoryBadgeGraphPanelStore((state) => state.selectedCurvatureCollapseGroupId);
  const selectedCurvatureObjectBindingId = useTheoryBadgeGraphPanelStore(
    (state) => state.selectedCurvatureCollapseObjectBindingId,
  );
  const activeTheoryRun = useTheoryCompoundRunStore((state) => state.activeTheoryRun);
  const setSelectedBadgeId = useTheoryBadgeGraphPanelStore((state) => state.setSelectedBadgeId);
  const setSelectedBadgeIds = useTheoryBadgeGraphPanelStore((state) => state.setSelectedBadgeIds);
  const toggleSelectedBadgeId = useTheoryBadgeGraphPanelStore((state) => state.toggleSelectedBadgeId);
  const rememberViewport = useTheoryBadgeGraphPanelStore((state) => state.rememberViewport);
  const setActiveAtlasLensId = useTheoryBadgeGraphPanelStore((state) => state.setActiveAtlasLensId);
  const setSelectedEvolutionStageId = useTheoryBadgeGraphPanelStore((state) => state.setSelectedStarSimStageId);
  const setSelectedObjectBindingId = useTheoryBadgeGraphPanelStore((state) => state.setSelectedStarSimObjectBindingId);
  const clearStarSimObjectBinding = useTheoryBadgeGraphPanelStore((state) => state.clearStarSimObjectBinding);
  const setSelectedCosmicRungId = useTheoryBadgeGraphPanelStore((state) => state.setSelectedCosmicDistanceRungId);
  const setSelectedCosmicObjectBindingId = useTheoryBadgeGraphPanelStore(
    (state) => state.setSelectedCosmicDistanceObjectBindingId,
  );
  const clearCosmicDistanceObjectBinding = useTheoryBadgeGraphPanelStore(
    (state) => state.clearCosmicDistanceObjectBinding,
  );
  const setSelectedSolarGroupId = useTheoryBadgeGraphPanelStore((state) => state.setSelectedSolarSpectrumGroupId);
  const setSelectedSolarObjectBindingId = useTheoryBadgeGraphPanelStore(
    (state) => state.setSelectedSolarSpectrumObjectBindingId,
  );
  const clearSolarSpectrumObjectBinding = useTheoryBadgeGraphPanelStore(
    (state) => state.clearSolarSpectrumObjectBinding,
  );
  const setSelectedCasimirGroupId = useTheoryBadgeGraphPanelStore((state) => state.setSelectedCasimirCavityGroupId);
  const setSelectedCasimirObjectBindingId = useTheoryBadgeGraphPanelStore(
    (state) => state.setSelectedCasimirCavityObjectBindingId,
  );
  const clearCasimirCavityObjectBinding = useTheoryBadgeGraphPanelStore(
    (state) => state.clearCasimirCavityObjectBinding,
  );
  const setSelectedWarpGroupId = useTheoryBadgeGraphPanelStore((state) => state.setSelectedWarpGrNhm2GroupId);
  const setSelectedWarpObjectBindingId = useTheoryBadgeGraphPanelStore(
    (state) => state.setSelectedWarpGrNhm2ObjectBindingId,
  );
  const clearWarpGrNhm2ObjectBinding = useTheoryBadgeGraphPanelStore(
    (state) => state.clearWarpGrNhm2ObjectBinding,
  );
  const setSelectedQeiGroupId = useTheoryBadgeGraphPanelStore((state) => state.setSelectedQeiStressEnergyGroupId);
  const setSelectedQeiObjectBindingId = useTheoryBadgeGraphPanelStore(
    (state) => state.setSelectedQeiStressEnergyObjectBindingId,
  );
  const clearQeiStressEnergyObjectBinding = useTheoryBadgeGraphPanelStore(
    (state) => state.clearQeiStressEnergyObjectBinding,
  );
  const setSelectedTokamakGroupId = useTheoryBadgeGraphPanelStore((state) => state.setSelectedTokamakPlasmaGroupId);
  const setSelectedTokamakObjectBindingId = useTheoryBadgeGraphPanelStore(
    (state) => state.setSelectedTokamakPlasmaObjectBindingId,
  );
  const clearTokamakPlasmaObjectBinding = useTheoryBadgeGraphPanelStore(
    (state) => state.clearTokamakPlasmaObjectBinding,
  );
  const setSelectedGalacticGroupId = useTheoryBadgeGraphPanelStore(
    (state) => state.setSelectedGalacticDynamicsGroupId,
  );
  const setSelectedGalacticObjectBindingId = useTheoryBadgeGraphPanelStore(
    (state) => state.setSelectedGalacticDynamicsObjectBindingId,
  );
  const clearGalacticDynamicsObjectBinding = useTheoryBadgeGraphPanelStore(
    (state) => state.clearGalacticDynamicsObjectBinding,
  );
  const setSelectedCurvatureGroupId = useTheoryBadgeGraphPanelStore(
    (state) => state.setSelectedCurvatureCollapseGroupId,
  );
  const setSelectedCurvatureObjectBindingId = useTheoryBadgeGraphPanelStore(
    (state) => state.setSelectedCurvatureCollapseObjectBindingId,
  );
  const clearCurvatureCollapseObjectBinding = useTheoryBadgeGraphPanelStore(
    (state) => state.clearCurvatureCollapseObjectBinding,
  );
  const mapOverlay = useTheoryMapOverlayStore();
  const setLocatorOverlay = useTheoryMapOverlayStore((state) => state.setLocatorOverlay);
  const restoreLiveAnswerContextOverlay = useTheoryMapOverlayStore((state) => state.restoreLiveAnswerContextOverlay);
  const setSelectionOverlay = useTheoryMapOverlayStore((state) => state.setSelectionOverlay);
  const theoryProbabilityTerrain = useMemo(
    () =>
      mapOverlay.source === "discussion_reflection"
        ? placementCertaintyFromReflection(mapOverlay.reflectionOverlay)
        : undefined,
    [mapOverlay.reflectionOverlay, mapOverlay.source],
  );
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

  useEffect(() => {
    if (!graph || activeLensId !== "stellar_evolution" || !selectedEvolutionStageId) return;
    const stage = STARSIM_STELLAR_EVOLUTION_STAGES.find((candidate) => candidate.id === selectedEvolutionStageId);
    if (!stage) return;
    if (
      selectedObjectBindingId &&
      !stage.objectBindings.some((binding) => binding.id === selectedObjectBindingId)
    ) {
      clearStarSimObjectBinding();
    }
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
  }, [
    clearStarSimObjectBinding,
    activeLensId,
    graph,
    selectedEvolutionStageId,
    selectedObjectBindingId,
    setSelectionOverlay,
  ]);

  useEffect(() => {
    if (!graph || activeLensId !== "cosmic_distance_ladder" || !selectedCosmicRungId) return;
    const rung = COSMIC_DISTANCE_LADDER_RUNGS.find((candidate) => candidate.id === selectedCosmicRungId);
    if (!rung) return;
    if (
      selectedCosmicObjectBindingId &&
      !rung.objectBindings.some((binding) => binding.id === selectedCosmicObjectBindingId)
    ) {
      clearCosmicDistanceObjectBinding();
    }
    const rungBadgeIds = rung.theoryBadgeIds.filter((badgeId: string) =>
      graph.badges.some((badge: TheoryBadgeV1) => badge.id === badgeId),
    );
    const highlighted = new Set(rungBadgeIds);
    const edgeIds = graph.edges
      .filter((edge: TheoryBadgeEdgeV1) => highlighted.has(edge.from) && highlighted.has(edge.to))
      .map((edge: TheoryBadgeEdgeV1) => edge.id);
    setSelectionOverlay({
      selectedBadgeIds: rungBadgeIds,
      highlightedBadgeIds: rungBadgeIds,
      highlightedEdgeIds: edgeIds,
      claimBoundaryNotes: rung.claimBoundaryBadgeIds.map(
        (badgeId: string) => `${badgeId}: distance-ladder estimate is calibration/model dependent.`,
      ),
    });
  }, [
    clearCosmicDistanceObjectBinding,
    activeLensId,
    graph,
    selectedCosmicObjectBindingId,
    selectedCosmicRungId,
    setSelectionOverlay,
  ]);

  useEffect(() => {
    if (!graph || activeLensId !== "solar_surface_spectrum" || !selectedSolarGroupId) return;
    const group = SOLAR_SPECTRUM_OBSERVATION_GROUPS.find((candidate) => candidate.id === selectedSolarGroupId);
    if (!group) return;
    if (
      selectedSolarObjectBindingId &&
      !group.objectBindings.some((binding) => binding.id === selectedSolarObjectBindingId)
    ) {
      clearSolarSpectrumObjectBinding();
    }
    const groupBadgeIds = group.theoryBadgeIds.filter((badgeId: string) =>
      graph.badges.some((badge: TheoryBadgeV1) => badge.id === badgeId),
    );
    const highlighted = new Set(groupBadgeIds);
    const edgeIds = graph.edges
      .filter((edge: TheoryBadgeEdgeV1) => highlighted.has(edge.from) && highlighted.has(edge.to))
      .map((edge: TheoryBadgeEdgeV1) => edge.id);
    setSelectionOverlay({
      selectedBadgeIds: groupBadgeIds,
      highlightedBadgeIds: groupBadgeIds,
      highlightedEdgeIds: edgeIds,
      claimBoundaryNotes: group.claimBoundaryBadgeIds.map(
        (badgeId: string) => `${badgeId}: solar observation proxy; calibration required.`,
      ),
    });
  }, [
    clearSolarSpectrumObjectBinding,
    activeLensId,
    graph,
    selectedSolarGroupId,
    selectedSolarObjectBindingId,
    setSelectionOverlay,
  ]);

  useEffect(() => {
    if (!graph || activeLensId !== "casimir_cavity_modes" || !selectedCasimirGroupId) return;
    const group = CASIMIR_CAVITY_GROUPS.find((candidate) => candidate.id === selectedCasimirGroupId);
    if (!group) return;
    if (
      selectedCasimirObjectBindingId &&
      !group.objectBindings.some((binding) => binding.id === selectedCasimirObjectBindingId)
    ) {
      clearCasimirCavityObjectBinding();
    }
    const groupBadgeIds = group.theoryBadgeIds.filter((badgeId: string) =>
      graph.badges.some((badge: TheoryBadgeV1) => badge.id === badgeId),
    );
    const highlighted = new Set(groupBadgeIds);
    const edgeIds = graph.edges
      .filter((edge: TheoryBadgeEdgeV1) => highlighted.has(edge.from) && highlighted.has(edge.to))
      .map((edge: TheoryBadgeEdgeV1) => edge.id);
    setSelectionOverlay({
      selectedBadgeIds: groupBadgeIds,
      highlightedBadgeIds: groupBadgeIds,
      highlightedEdgeIds: edgeIds,
      claimBoundaryNotes: group.claimBoundaryBadgeIds.map(
        (badgeId: string) => `${badgeId}: Casimir source-context row; diagnostic only.`,
      ),
    });
  }, [
    clearCasimirCavityObjectBinding,
    activeLensId,
    graph,
    selectedCasimirGroupId,
    selectedCasimirObjectBindingId,
    setSelectionOverlay,
  ]);

  useEffect(() => {
    if (!graph || activeLensId !== "warp_gr_nhm2" || !selectedWarpGroupId) return;
    const group = WARP_GR_NHM2_GROUPS.find((candidate) => candidate.id === selectedWarpGroupId);
    if (!group) return;
    if (
      selectedWarpObjectBindingId &&
      !group.objectBindings.some((binding) => binding.id === selectedWarpObjectBindingId)
    ) {
      clearWarpGrNhm2ObjectBinding();
    }
    const groupBadgeIds = group.theoryBadgeIds.filter((badgeId: string) =>
      graph.badges.some((badge: TheoryBadgeV1) => badge.id === badgeId),
    );
    const highlighted = new Set(groupBadgeIds);
    const edgeIds = graph.edges
      .filter((edge: TheoryBadgeEdgeV1) => highlighted.has(edge.from) && highlighted.has(edge.to))
      .map((edge: TheoryBadgeEdgeV1) => edge.id);
    setSelectionOverlay({
      selectedBadgeIds: groupBadgeIds,
      highlightedBadgeIds: groupBadgeIds,
      highlightedEdgeIds: edgeIds,
      claimBoundaryNotes: group.claimBoundaryBadgeIds.map(
        (badgeId: string) => `${badgeId}: NHM2 diagnostic-only boundary.`,
      ),
    });
  }, [
    clearWarpGrNhm2ObjectBinding,
    activeLensId,
    graph,
    selectedWarpGroupId,
    selectedWarpObjectBindingId,
    setSelectionOverlay,
  ]);

  useEffect(() => {
    if (!graph || activeLensId !== "qei_stress_energy" || !selectedQeiGroupId) return;
    const group = QEI_STRESS_ENERGY_GROUPS.find((candidate) => candidate.id === selectedQeiGroupId);
    if (!group) return;
    if (
      selectedQeiObjectBindingId &&
      !group.objectBindings.some((binding) => binding.id === selectedQeiObjectBindingId)
    ) {
      clearQeiStressEnergyObjectBinding();
    }
    const groupBadgeIds = group.theoryBadgeIds.filter((badgeId: string) =>
      graph.badges.some((badge: TheoryBadgeV1) => badge.id === badgeId),
    );
    const highlighted = new Set(groupBadgeIds);
    const edgeIds = graph.edges
      .filter((edge: TheoryBadgeEdgeV1) => highlighted.has(edge.from) && highlighted.has(edge.to))
      .map((edge: TheoryBadgeEdgeV1) => edge.id);
    setSelectionOverlay({
      selectedBadgeIds: groupBadgeIds,
      highlightedBadgeIds: groupBadgeIds,
      highlightedEdgeIds: edgeIds,
      claimBoundaryNotes: group.claimBoundaryBadgeIds.map(
        (badgeId: string) => `${badgeId}: QEI/stress diagnostic-only boundary.`,
      ),
    });
  }, [
    clearQeiStressEnergyObjectBinding,
    activeLensId,
    graph,
    selectedQeiGroupId,
    selectedQeiObjectBindingId,
    setSelectionOverlay,
  ]);

  useEffect(() => {
    if (!graph || activeLensId !== "tokamak_plasma" || !selectedTokamakGroupId) return;
    const group = TOKAMAK_PLASMA_GROUPS.find((candidate) => candidate.id === selectedTokamakGroupId);
    if (!group) return;
    if (
      selectedTokamakObjectBindingId &&
      !group.objectBindings.some((binding) => binding.id === selectedTokamakObjectBindingId)
    ) {
      clearTokamakPlasmaObjectBinding();
    }
    const groupBadgeIds = group.theoryBadgeIds.filter((badgeId: string) =>
      graph.badges.some((badge: TheoryBadgeV1) => badge.id === badgeId),
    );
    const highlighted = new Set(groupBadgeIds);
    const edgeIds = graph.edges
      .filter((edge: TheoryBadgeEdgeV1) => highlighted.has(edge.from) && highlighted.has(edge.to))
      .map((edge: TheoryBadgeEdgeV1) => edge.id);
    setSelectionOverlay({
      selectedBadgeIds: groupBadgeIds,
      highlightedBadgeIds: groupBadgeIds,
      highlightedEdgeIds: edgeIds,
      claimBoundaryNotes: group.claimBoundaryBadgeIds.map(
        (badgeId: string) => `${badgeId}: Tokamak diagnostic/proxy boundary.`,
      ),
    });
  }, [
    clearTokamakPlasmaObjectBinding,
    activeLensId,
    graph,
    selectedTokamakGroupId,
    selectedTokamakObjectBindingId,
    setSelectionOverlay,
  ]);

  useEffect(() => {
    if (!graph || activeLensId !== "galactic_dynamics" || !selectedGalacticGroupId) return;
    const group = GALACTIC_DYNAMICS_GROUPS.find((candidate) => candidate.id === selectedGalacticGroupId);
    if (!group) return;
    if (
      selectedGalacticObjectBindingId &&
      !group.objectBindings.some((binding) => binding.id === selectedGalacticObjectBindingId)
    ) {
      clearGalacticDynamicsObjectBinding();
    }
    const groupBadgeIds = group.theoryBadgeIds.filter((badgeId: string) =>
      graph.badges.some((badge: TheoryBadgeV1) => badge.id === badgeId),
    );
    const highlighted = new Set(groupBadgeIds);
    const edgeIds = graph.edges
      .filter((edge: TheoryBadgeEdgeV1) => highlighted.has(edge.from) && highlighted.has(edge.to))
      .map((edge: TheoryBadgeEdgeV1) => edge.id);
    setSelectionOverlay({
      selectedBadgeIds: groupBadgeIds,
      highlightedBadgeIds: groupBadgeIds,
      highlightedEdgeIds: edgeIds,
      claimBoundaryNotes: group.claimBoundaryBadgeIds.map(
        (badgeId: string) => `${badgeId}: Galactic null-model/diagnostic boundary.`,
      ),
    });
  }, [
    clearGalacticDynamicsObjectBinding,
    activeLensId,
    graph,
    selectedGalacticGroupId,
    selectedGalacticObjectBindingId,
    setSelectionOverlay,
  ]);

  useEffect(() => {
    if (!graph || activeLensId !== "curvature_collapse" || !selectedCurvatureGroupId) return;
    const group = CURVATURE_COLLAPSE_GROUPS.find((candidate) => candidate.id === selectedCurvatureGroupId);
    if (!group) return;
    if (
      selectedCurvatureObjectBindingId &&
      !group.objectBindings.some((binding) => binding.id === selectedCurvatureObjectBindingId)
    ) {
      clearCurvatureCollapseObjectBinding();
    }
    const groupBadgeIds = group.theoryBadgeIds.filter((badgeId: string) =>
      graph.badges.some((badge: TheoryBadgeV1) => badge.id === badgeId),
    );
    const highlighted = new Set(groupBadgeIds);
    const edgeIds = graph.edges
      .filter((edge: TheoryBadgeEdgeV1) => highlighted.has(edge.from) && highlighted.has(edge.to))
      .map((edge: TheoryBadgeEdgeV1) => edge.id);
    setSelectionOverlay({
      selectedBadgeIds: groupBadgeIds,
      highlightedBadgeIds: groupBadgeIds,
      highlightedEdgeIds: edgeIds,
      claimBoundaryNotes: group.claimBoundaryBadgeIds.map(
        (badgeId: string) => `${badgeId}: Curvature/collapse benchmark boundary.`,
      ),
    });
  }, [
    clearCurvatureCollapseObjectBinding,
    activeLensId,
    graph,
    selectedCurvatureGroupId,
    selectedCurvatureObjectBindingId,
    setSelectionOverlay,
  ]);

  const selectedBadge = useMemo(
    () => (graph?.badges ?? []).find((badge: TheoryBadgeV1) => badge.id === selectedId) ?? null,
    [graph?.badges, selectedId],
  );

  const seedAtlasFrontierTrace = useMemo(() => {
    if (!graph) return null;
    const originBadgeIds = selectedBadgeIds.length > 0 ? selectedBadgeIds : selectedId ? [selectedId] : [];
    const atlasQuery = [
      selectedBadge?.title,
      ...(selectedBadge?.subjects.slice(0, 4) ?? []),
      query.trim() || "theory badge graph frontier map",
    ]
      .filter(Boolean)
      .join(" ");
    return traceTheoryFrontierVectorField({
      graph,
      query: atlasQuery,
      originBadgeIds,
      searchSeed: `seed-atlas:${graph.graphId}:${originBadgeIds.join("+") || "global"}:${query.trim() || "all"}`,
      generatedAt: graph.generatedAt,
      limit: 8,
      maxDepth: 8,
    });
  }, [graph, query, selectedBadge, selectedBadgeIds, selectedId]);

  const singlePlaybackPlan = useMemo(() => {
    if (!graph || !selectedId || selectedBadgeIds.length > 1) return null;
    return resolveTheoryBadgePlaybackPlan({ graph, targetBadgeId: selectedId });
  }, [graph, selectedBadgeIds.length, selectedId]);

  const multiTrace = useMemo(() => {
    if (!graph || selectedBadgeIds.length < 2) return null;
    return resolveTheoryBadgeConnectionTrace({ graph, badgeIds: selectedBadgeIds });
  }, [graph, selectedBadgeIds]);

  const atlasLens = useMemo(() => {
    if (!graph || !activeLensId) return null;
    return resolvePhysicsAtlasLens({
      graph,
      atlas: buildHelixPhysicsAtlasV1({ graph }),
      blockId: activeLensId,
    });
  }, [activeLensId, graph]);

  const activeAtlasBlock = useMemo(() => {
    if (!graph || !activeLensId) return null;
    return buildHelixPhysicsAtlasV1({ graph }).blocks.find((block) => block.id === activeLensId) ?? null;
  }, [activeLensId, graph]);

  const rememberedAtlasLensId = useMemo<TheoryAtlasLensId | null>(() => {
    if (activeLensId) return activeLensId;
    if (selectedEvolutionStageId || selectedObjectBindingId) return "stellar_evolution";
    if (selectedCosmicRungId || selectedCosmicObjectBindingId) return "cosmic_distance_ladder";
    if (selectedSolarGroupId || selectedSolarObjectBindingId) return "solar_surface_spectrum";
    if (selectedCasimirGroupId || selectedCasimirObjectBindingId) return "casimir_cavity_modes";
    if (selectedWarpGroupId || selectedWarpObjectBindingId) return "warp_gr_nhm2";
    if (selectedQeiGroupId || selectedQeiObjectBindingId) return "qei_stress_energy";
    if (selectedTokamakGroupId || selectedTokamakObjectBindingId) return "tokamak_plasma";
    if (selectedGalacticGroupId || selectedGalacticObjectBindingId) return "galactic_dynamics";
    if (selectedCurvatureGroupId || selectedCurvatureObjectBindingId) return "curvature_collapse";
    return null;
  }, [
    activeLensId,
    selectedCasimirGroupId,
    selectedCasimirObjectBindingId,
    selectedCosmicObjectBindingId,
    selectedCosmicRungId,
    selectedCurvatureGroupId,
    selectedCurvatureObjectBindingId,
    selectedEvolutionStageId,
    selectedGalacticGroupId,
    selectedGalacticObjectBindingId,
    selectedObjectBindingId,
    selectedQeiGroupId,
    selectedQeiObjectBindingId,
    selectedSolarGroupId,
    selectedSolarObjectBindingId,
    selectedTokamakGroupId,
    selectedTokamakObjectBindingId,
    selectedWarpGroupId,
    selectedWarpObjectBindingId,
  ]);

  const highlightedBadgeIds =
    multiTrace?.connectingBadgeIds ??
    singlePlaybackPlan?.orderedBadgeIds ??
    (mapOverlay.highlightedBadgeIds.length > 0 ? mapOverlay.highlightedBadgeIds : atlasLens?.highlightedBadgeIds ?? []);
  const highlightedEdgeIds = useMemo(() => {
    if (!graph) return [];
    if (multiTrace) return multiTrace.connectingEdgeIds;
    if (!singlePlaybackPlan && mapOverlay.highlightedEdgeIds.length > 0) return mapOverlay.highlightedEdgeIds;
    if (!singlePlaybackPlan && atlasLens) return atlasLens.highlightedEdgeIds;
    const highlighted = new Set(highlightedBadgeIds);
    return graph.edges
      .filter((edge: TheoryBadgeEdgeV1) => highlighted.has(edge.from) && highlighted.has(edge.to))
      .map((edge: TheoryBadgeEdgeV1) => edge.id);
  }, [atlasLens, graph, highlightedBadgeIds, mapOverlay.highlightedEdgeIds, multiTrace, singlePlaybackPlan]);

  const routeEligibility = useMemo(() => {
    if (!graph) return null;
    const startBadgeIds =
      selectedBadgeIds.length > 0
        ? selectedBadgeIds
        : selectedId
          ? [selectedId]
          : atlasLens?.centerBadgeIds.length
            ? atlasLens.centerBadgeIds
            : highlightedBadgeIds.slice(0, 12);
    if (startBadgeIds.length === 0) return null;
    return resolveTheoryRouteEligibility({
      graph,
      startBadgeIds,
      allowedClaimLevel: "CL3",
      allowProxyEdges: true,
      requireEvidence: false,
    });
  }, [atlasLens?.centerBadgeIds, graph, highlightedBadgeIds, selectedBadgeIds, selectedId]);

  const routeBadgeLabels = useMemo(
    () => routeBadgeLabelsForMode(routeEligibility, "execution"),
    [routeEligibility],
  );

  const activePlayback =
    playbackStore.activeTargetBadgeId === selectedBadge?.id || playbackStore.activeTargetBadgeId
      ? playbackStore.activeRun
      : null;
  const playbackBadgeIds = Array.from(
    new Set([
      ...(activePlayback?.steps.map((step: TheoryBadgePlaybackStepV1) => step.badgeId) ?? []),
      ...(activeTheoryRun?.rows.map((row) => row.badgeId) ?? []),
    ]),
  );
  const solvedBadgeIds = Array.from(
    new Set([
      ...(activePlayback?.steps
        .filter((step: TheoryBadgePlaybackStepV1) => step.status === "solved")
        .map((step: TheoryBadgePlaybackStepV1) => step.badgeId) ?? []),
      ...(activeTheoryRun?.rows
        .filter((row) => row.status === "computed" || row.status === "solved")
        .map((row) => row.badgeId) ?? []),
    ]),
  );
  const failedBadgeIds = Array.from(
    new Set([
      ...(activePlayback?.steps
        .filter((step: TheoryBadgePlaybackStepV1) => step.status === "failed")
        .map((step: TheoryBadgePlaybackStepV1) => step.badgeId) ?? []),
      ...(activeTheoryRun?.rows
        .filter((row) => row.status === "blocked" || row.status === "failed")
        .map((row) => row.badgeId) ?? []),
    ]),
  );

  const shouldAcceptArtifactRun = (expected?: ArtifactRunExpectation): boolean => {
    if (!expected) return true;
    const state = useTheoryBadgeGraphPanelStore.getState();
    if (expected.selectedBadgeId && state.selectedBadgeId !== expected.selectedBadgeId) return false;
    if (expected.activeAtlasLensId && state.activeAtlasLensId !== expected.activeAtlasLensId) return false;
    if (expected.selectedCasimirGroupId && state.selectedCasimirCavityGroupId !== expected.selectedCasimirGroupId) {
      return false;
    }
    if (expected.selectedWarpGroupId && state.selectedWarpGrNhm2GroupId !== expected.selectedWarpGroupId) return false;
    if (expected.selectedQeiGroupId && state.selectedQeiStressEnergyGroupId !== expected.selectedQeiGroupId) return false;
    return true;
  };

  const selectEvidenceRunRow = (run: TheoryCompoundRunV1, preferredBadgeId?: string) => {
    const runStore = useTheoryCompoundRunStore.getState();
    const preferredRow = preferredBadgeId
      ? run.rows.find(
          (row) =>
            row.badgeId === preferredBadgeId &&
            (row.runtimeReceiptV1 || row.runtimeMathTraceV1 || row.kind === "gate" || row.kind === "evidence"),
        )
      : null;
    const row =
      preferredRow ??
      run.rows.find((candidate) => candidate.runtimeReceiptV1) ??
      run.rows.find((candidate) => candidate.runtimeMathTraceV1) ??
      run.rows.find((candidate) => candidate.kind === "gate" || candidate.kind === "evidence") ??
      run.rows[0];
    if (row) runStore.selectTheoryRunRow(row.id);
  };

  const preferredEvidenceBadgeId = (badgeIds: string[]): string | undefined =>
    [
      "nhm2.tensor.same_chart_full_tensor",
      "nhm2.closure.wall_t00_source_residual",
      "nhm2.energy_condition.observer_robust_gate",
      "nhm2.qei.worldline_dossier",
      "casimir.material.lifshitz_receipt",
      "casimir.geometry.beyond_pfa_validity",
      "nhm2.natario.invariant_audit",
      "physics.gr.einstein_field_equation",
    ].find((badgeId) => badgeIds.includes(badgeId)) ?? badgeIds[0];

  const loadArtifactBackedTheoryRun = async ({
    badgeIds,
    mode = "dependency_path",
    expected,
    preferredBadgeId,
  }: {
    badgeIds: string[];
    mode?: TheoryCompoundRunMode;
    expected?: ArtifactRunExpectation;
    preferredBadgeId?: string;
  }) => {
    if (badgeIds.length === 0) return;
    try {
      const response = await fetch("/api/helix/theory/compound-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          badgeIds,
          mode,
          source: "theory_badge_graph",
          includeScalar: true,
          includeRuntime: true,
          includeEvidence: true,
          includeBoundaries: true,
          runQuick: false,
        }),
      });
      if (!response.ok) return;
      const payload = await response.json() as { artifact_v1?: unknown };
      const artifact = payload.artifact_v1;
      if (!isTheoryCompoundRunV1(artifact)) return;
      if (!shouldAcceptArtifactRun(expected)) return;
      const runStore = useTheoryCompoundRunStore.getState();
      runStore.loadTheoryRun(artifact);
      selectEvidenceRunRow(artifact, preferredBadgeId ?? preferredEvidenceBadgeId(badgeIds));
    } catch {
      // Static/reference run remains loaded when server-side artifact enrichment is unavailable.
    }
  };

  const loadTheoryRunEvidence = ({
    badgeIds,
    mode = "dependency_path",
    expected,
    preferredBadgeId,
    openWorkbench = false,
  }: {
    badgeIds: string[];
    mode?: TheoryCompoundRunMode;
    expected?: ArtifactRunExpectation;
    preferredBadgeId?: string;
    openWorkbench?: boolean;
  }) => {
    if (!graph || badgeIds.length === 0) return;
    const run = buildTheoryCompoundRun({
      graph,
      badgeIds,
      mode,
      source: "theory_badge_graph",
      includeScalar: true,
      includeRuntime: true,
      includeEvidence: true,
      includeBoundaries: true,
    });
    useTheoryCompoundRunStore.getState().loadTheoryRun(run);
    selectEvidenceRunRow(run, preferredBadgeId ?? preferredEvidenceBadgeId(badgeIds));
    void loadArtifactBackedTheoryRun({
      badgeIds,
      mode,
      expected,
      preferredBadgeId: preferredBadgeId ?? preferredEvidenceBadgeId(badgeIds),
    });
    if (openWorkbench) useWorkstationLayoutStore.getState().openPanelInActiveGroup("scientific-calculator");
  };

  const selectBadge = (badgeId: string) => {
    const badge = graph?.badges.find((candidate: TheoryBadgeV1) => candidate.id === badgeId) ?? null;
    setSelectedBadgeId(badgeId);
    setSelectedBadgeIds([]);
    setSelectedEvolutionStageId(null);
    setSelectedCosmicRungId(null);
    setSelectedSolarGroupId(null);
    setSelectedCasimirGroupId(null);
    setSelectedWarpGroupId(null);
    setSelectedQeiGroupId(null);
    setSelectedTokamakGroupId(null);
    setSelectedGalacticGroupId(null);
    setSelectedCurvatureGroupId(null);
    clearStarSimObjectBinding();
    clearCosmicDistanceObjectBinding();
    clearSolarSpectrumObjectBinding();
    clearCasimirCavityObjectBinding();
    clearWarpGrNhm2ObjectBinding();
    clearQeiStressEnergyObjectBinding();
    clearTokamakPlasmaObjectBinding();
    clearGalacticDynamicsObjectBinding();
    clearCurvatureCollapseObjectBinding();
    useScientificCalculatorStore.getState().setTheoryLoadout(null);
    const shouldLoadRuntimeRun = graph && badge && badge.calculatorPayloads.length === 0 && hasRuntimeReferenceEquation(badge);
    if (shouldLoadRuntimeRun) {
      loadTheoryRunEvidence({
        badgeIds: [badge.id],
        mode: "dependency_path",
        expected: { selectedBadgeId: badge.id },
        preferredBadgeId: badge.id,
      });
    } else {
      useTheoryCompoundRunStore.getState().clearTheoryRun();
    }
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
    if (graph) {
      const loadout = buildTheoryCalculatorLoadout({
        graph,
        badgeIds: [badge.id],
        mode: "selected_badges",
        source: "achievement_map",
        includeContextItems: false,
        payloadIdsByBadgeId: {
          [badge.id]: [payload.id],
        },
      });
      const scientificState = useScientificCalculatorStore.getState();
      scientificState.setTheoryLoadout(loadout);
      scientificState.loadTheoryLoadoutItem(1);
    }
    dispatchScientificCalculatorMathPicked({
      latex: payload.displayLatex || payload.expression,
      sourcePath: `theory://${graph?.graphId ?? "nhm2-theory-badge-graph"}/${badge.id}/${payload.id}`,
      anchor: payload.id,
    });
  };

  const selectEvolutionStage = (stage: StarSimStellarEvolutionStage) => {
    if (!graph) return;
    setActiveAtlasLensId("stellar_evolution");
    setSelectedEvolutionStageId(stage.id);
    setSelectedCosmicRungId(null);
    setSelectedSolarGroupId(null);
    setSelectedCasimirGroupId(null);
    setSelectedWarpGroupId(null);
    setSelectedQeiGroupId(null);
    setSelectedTokamakGroupId(null);
    setSelectedGalacticGroupId(null);
    setSelectedCurvatureGroupId(null);
    setSelectedObjectBindingId(null);
    clearCosmicDistanceObjectBinding();
    clearSolarSpectrumObjectBinding();
    clearCasimirCavityObjectBinding();
    clearWarpGrNhm2ObjectBinding();
    clearQeiStressEnergyObjectBinding();
    clearTokamakPlasmaObjectBinding();
    clearGalacticDynamicsObjectBinding();
    clearCurvatureCollapseObjectBinding();
    setSelectedBadgeId(null);
    setSelectedBadgeIds([]);
    useScientificCalculatorStore.getState().setTheoryLoadout(null);
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

  const selectStarSimObjectBinding = (stage: StarSimStellarEvolutionStage, bindingId: string) => {
    if (!graph) return;
    const binding = stage.objectBindings.find((candidate) => candidate.id === bindingId);
    if (!binding) return;
    selectEvolutionStage(stage);
    setSelectedObjectBindingId(binding.id);
    setSelectedCosmicRungId(null);
    setSelectedSolarGroupId(null);
    setSelectedCasimirGroupId(null);
    setSelectedWarpGroupId(null);
    setSelectedQeiGroupId(null);
    setSelectedTokamakGroupId(null);
    setSelectedGalacticGroupId(null);
    setSelectedCurvatureGroupId(null);
    clearCosmicDistanceObjectBinding();
    clearSolarSpectrumObjectBinding();
    clearCasimirCavityObjectBinding();
    clearWarpGrNhm2ObjectBinding();
    clearQeiStressEnergyObjectBinding();
    clearTokamakPlasmaObjectBinding();
    clearGalacticDynamicsObjectBinding();
    clearCurvatureCollapseObjectBinding();
    const payloadIdsByBadgeId = stage.calculatorPayloadRefs.reduce<Record<string, string[]>>((acc, ref) => {
      acc[ref.badgeId] = [...(acc[ref.badgeId] ?? []), ref.payloadId];
      return acc;
    }, {});
    const objectContext = buildStarSimObjectBindings({
      ...binding.input,
      source: "manual",
    });
    const restorationBadgeIds = stage.theoryBadgeIds.filter((badgeId) => badgeId.startsWith("starsim.restoration."));
    const targetBadgeIds = stage.theoryBadgeIds.includes("starsim.runtime.evaluate_fusion_microphysics")
      ? ["starsim.runtime.evaluate_fusion_microphysics", ...restorationBadgeIds]
      : stage.theoryBadgeIds;
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: targetBadgeIds,
      mode: stage.theoryBadgeIds.includes("starsim.runtime.evaluate_fusion_microphysics")
        ? "dependency_path"
        : "selected_badges",
      source: "achievement_map",
      objectContext,
      includeContextItems: true,
      payloadIdsByBadgeId,
    });
    const scientificState = useScientificCalculatorStore.getState();
    scientificState.setTheoryLoadout(loadout);
    const firstObjectScalar =
      loadout.items.find(
        (item) =>
          item.kind === "calculator_payload" &&
          item.badgeId === "starsim.observable.surface_temperature_proxy",
      ) ??
      loadout.items.find(
        (item) => item.kind === "calculator_payload" && item.badgeId.startsWith("starsim."),
      ) ??
      loadout.items.find((item) => item.kind === "calculator_payload");
    if (firstObjectScalar) scientificState.loadTheoryLoadoutItem(firstObjectScalar.index);
  };

  const clearStarSimBindingSelection = () => {
    clearStarSimObjectBinding();
    useScientificCalculatorStore.getState().setTheoryLoadout(null);
  };

  const selectCosmicDistanceRung = (rung: CosmicDistanceLadderRung) => {
    if (!graph) return;
    setActiveAtlasLensId("cosmic_distance_ladder");
    setSelectedCosmicRungId(rung.id);
    setSelectedCosmicObjectBindingId(null);
    setSelectedEvolutionStageId(null);
    setSelectedSolarGroupId(null);
    setSelectedCasimirGroupId(null);
    setSelectedWarpGroupId(null);
    setSelectedQeiGroupId(null);
    setSelectedTokamakGroupId(null);
    setSelectedGalacticGroupId(null);
    setSelectedCurvatureGroupId(null);
    clearStarSimObjectBinding();
    clearSolarSpectrumObjectBinding();
    clearCasimirCavityObjectBinding();
    clearWarpGrNhm2ObjectBinding();
    clearQeiStressEnergyObjectBinding();
    clearTokamakPlasmaObjectBinding();
    clearGalacticDynamicsObjectBinding();
    clearCurvatureCollapseObjectBinding();
    setSelectedBadgeId(null);
    setSelectedBadgeIds([]);
    useScientificCalculatorStore.getState().setTheoryLoadout(null);
    const rungBadgeIds = rung.theoryBadgeIds.filter((badgeId: string) =>
      graph.badges.some((badge: TheoryBadgeV1) => badge.id === badgeId),
    );
    const highlighted = new Set(rungBadgeIds);
    const edgeIds = graph.edges
      .filter((edge: TheoryBadgeEdgeV1) => highlighted.has(edge.from) && highlighted.has(edge.to))
      .map((edge: TheoryBadgeEdgeV1) => edge.id);
    setSelectionOverlay({
      selectedBadgeIds: rungBadgeIds,
      highlightedBadgeIds: rungBadgeIds,
      highlightedEdgeIds: edgeIds,
      claimBoundaryNotes: rung.claimBoundaryBadgeIds.map(
        (badgeId: string) => `${badgeId}: distance-ladder estimate is calibration/model dependent.`,
      ),
    });
  };

  const selectCosmicObjectBinding = (rung: CosmicDistanceLadderRung, bindingId: string) => {
    if (!graph) return;
    const binding = rung.objectBindings.find((candidate) => candidate.id === bindingId);
    if (!binding) return;
    selectCosmicDistanceRung(rung);
    setSelectedCosmicObjectBindingId(binding.id);
    const payloadIdsByBadgeId = rung.calculatorPayloadRefs.reduce<Record<string, string[]>>((acc, ref) => {
      acc[ref.badgeId] = [...(acc[ref.badgeId] ?? []), ref.payloadId];
      return acc;
    }, {});
    const objectContext = buildCosmicDistanceObjectBindings({
      ...binding.input,
      source: "manual",
    });
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: rung.theoryBadgeIds,
      mode: "selected_badges",
      source: "achievement_map",
      objectContext,
      includeContextItems: true,
      payloadIdsByBadgeId,
    });
    const scientificState = useScientificCalculatorStore.getState();
    scientificState.setTheoryLoadout(loadout);
    const firstCosmicScalar =
      loadout.items.find((item) => item.kind === "calculator_payload" && item.badgeId.startsWith("cosmic.")) ??
      loadout.items.find((item) => item.kind === "calculator_payload");
    if (firstCosmicScalar) scientificState.loadTheoryLoadoutItem(firstCosmicScalar.index);
  };

  const clearCosmicBindingSelection = () => {
    clearCosmicDistanceObjectBinding();
    useScientificCalculatorStore.getState().setTheoryLoadout(null);
  };

  const selectSolarSpectrumGroup = (group: SolarSpectrumObservationGroup) => {
    if (!graph) return;
    setActiveAtlasLensId("solar_surface_spectrum");
    setSelectedSolarGroupId(group.id);
    setSelectedSolarObjectBindingId(null);
    setSelectedEvolutionStageId(null);
    setSelectedCosmicRungId(null);
    setSelectedCasimirGroupId(null);
    setSelectedWarpGroupId(null);
    setSelectedQeiGroupId(null);
    setSelectedTokamakGroupId(null);
    setSelectedGalacticGroupId(null);
    setSelectedCurvatureGroupId(null);
    clearStarSimObjectBinding();
    clearCosmicDistanceObjectBinding();
    clearCasimirCavityObjectBinding();
    clearWarpGrNhm2ObjectBinding();
    clearQeiStressEnergyObjectBinding();
    clearTokamakPlasmaObjectBinding();
    clearGalacticDynamicsObjectBinding();
    clearCurvatureCollapseObjectBinding();
    setSelectedBadgeId(null);
    setSelectedBadgeIds([]);
    useScientificCalculatorStore.getState().setTheoryLoadout(null);
    const groupBadgeIds = group.theoryBadgeIds.filter((badgeId: string) =>
      graph.badges.some((badge: TheoryBadgeV1) => badge.id === badgeId),
    );
    const highlighted = new Set(groupBadgeIds);
    const edgeIds = graph.edges
      .filter((edge: TheoryBadgeEdgeV1) => highlighted.has(edge.from) && highlighted.has(edge.to))
      .map((edge: TheoryBadgeEdgeV1) => edge.id);
    setSelectionOverlay({
      selectedBadgeIds: groupBadgeIds,
      highlightedBadgeIds: groupBadgeIds,
      highlightedEdgeIds: edgeIds,
      claimBoundaryNotes: group.claimBoundaryBadgeIds.map(
        (badgeId: string) => `${badgeId}: solar observation proxy; calibration required.`,
      ),
    });
  };

  const selectSolarObjectBinding = (group: SolarSpectrumObservationGroup, bindingId: string) => {
    if (!graph) return;
    const binding = group.objectBindings.find((candidate) => candidate.id === bindingId);
    if (!binding) return;
    selectSolarSpectrumGroup(group);
    setSelectedSolarObjectBindingId(binding.id);
    const payloadIdsByBadgeId = group.calculatorPayloadRefs.reduce<Record<string, string[]>>((acc, ref) => {
      acc[ref.badgeId] = [...(acc[ref.badgeId] ?? []), ref.payloadId];
      return acc;
    }, {});
    const objectContext = buildSolarSpectrumObservationBindings({
      ...binding.input,
      source: "manual",
    });
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: group.theoryBadgeIds,
      mode: "selected_badges",
      source: "achievement_map",
      objectContext,
      includeContextItems: true,
      payloadIdsByBadgeId,
    });
    const scientificState = useScientificCalculatorStore.getState();
    scientificState.setTheoryLoadout(loadout);
    const firstSolarScalar =
      loadout.items.find((item) => item.kind === "calculator_payload" && item.badgeId.startsWith("solar.")) ??
      loadout.items.find((item) => item.kind === "calculator_payload");
    if (firstSolarScalar) scientificState.loadTheoryLoadoutItem(firstSolarScalar.index);
  };

  const clearSolarBindingSelection = () => {
    clearSolarSpectrumObjectBinding();
    useScientificCalculatorStore.getState().setTheoryLoadout(null);
  };

  const selectCasimirCavityGroup = (group: CasimirCavityGroup) => {
    if (!graph) return;
    setActiveAtlasLensId("casimir_cavity_modes");
    setSelectedCasimirGroupId(group.id);
    setSelectedCasimirObjectBindingId(null);
    setSelectedEvolutionStageId(null);
    setSelectedCosmicRungId(null);
    setSelectedSolarGroupId(null);
    setSelectedWarpGroupId(null);
    setSelectedQeiGroupId(null);
    setSelectedTokamakGroupId(null);
    setSelectedGalacticGroupId(null);
    setSelectedCurvatureGroupId(null);
    clearStarSimObjectBinding();
    clearCosmicDistanceObjectBinding();
    clearSolarSpectrumObjectBinding();
    clearWarpGrNhm2ObjectBinding();
    clearQeiStressEnergyObjectBinding();
    clearTokamakPlasmaObjectBinding();
    clearGalacticDynamicsObjectBinding();
    clearCurvatureCollapseObjectBinding();
    setSelectedBadgeId(null);
    setSelectedBadgeIds([]);
    useScientificCalculatorStore.getState().setTheoryLoadout(null);
    const groupBadgeIds = group.theoryBadgeIds.filter((badgeId: string) =>
      graph.badges.some((badge: TheoryBadgeV1) => badge.id === badgeId),
    );
    const highlighted = new Set(groupBadgeIds);
    const edgeIds = graph.edges
      .filter((edge: TheoryBadgeEdgeV1) => highlighted.has(edge.from) && highlighted.has(edge.to))
      .map((edge: TheoryBadgeEdgeV1) => edge.id);
    setSelectionOverlay({
      selectedBadgeIds: groupBadgeIds,
      highlightedBadgeIds: groupBadgeIds,
      highlightedEdgeIds: edgeIds,
      claimBoundaryNotes: group.claimBoundaryBadgeIds.map(
        (badgeId: string) => `${badgeId}: Casimir source-context row; diagnostic only.`,
      ),
    });
    loadTheoryRunEvidence({
      badgeIds: groupBadgeIds,
      mode: "dependency_path",
      expected: {
        activeAtlasLensId: "casimir_cavity_modes",
        selectedCasimirGroupId: group.id,
      },
      preferredBadgeId: preferredEvidenceBadgeId(groupBadgeIds),
    });
  };

  const selectCasimirObjectBinding = (group: CasimirCavityGroup, bindingId: string) => {
    if (!graph) return;
    const binding = group.objectBindings.find((candidate) => candidate.id === bindingId);
    if (!binding) return;
    selectCasimirCavityGroup(group);
    setSelectedCasimirObjectBindingId(binding.id);
    const payloadIdsByBadgeId = group.calculatorPayloadRefs.reduce<Record<string, string[]>>((acc, ref) => {
      acc[ref.badgeId] = [...(acc[ref.badgeId] ?? []), ref.payloadId];
      return acc;
    }, {});
    const objectContext = buildCasimirCavityObjectBindings({
      ...binding.input,
      source: "manual",
    });
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: group.theoryBadgeIds,
      mode: "selected_badges",
      source: "achievement_map",
      objectContext,
      includeContextItems: true,
      payloadIdsByBadgeId,
    });
    const scientificState = useScientificCalculatorStore.getState();
    scientificState.setTheoryLoadout(loadout);
    const firstCasimirScalar =
      loadout.items.find((item) => item.kind === "calculator_payload" && item.badgeId.startsWith("casimir.")) ??
      loadout.items.find((item) => item.kind === "calculator_payload");
    if (firstCasimirScalar) scientificState.loadTheoryLoadoutItem(firstCasimirScalar.index);
  };

  const clearCasimirBindingSelection = () => {
    clearCasimirCavityObjectBinding();
    useScientificCalculatorStore.getState().setTheoryLoadout(null);
  };

  const selectWarpGrNhm2Group = (group: WarpGrNhm2Group) => {
    if (!graph) return;
    setActiveAtlasLensId("warp_gr_nhm2");
    setSelectedWarpGroupId(group.id);
    setSelectedWarpObjectBindingId(null);
    setSelectedEvolutionStageId(null);
    setSelectedCosmicRungId(null);
    setSelectedSolarGroupId(null);
    setSelectedCasimirGroupId(null);
    setSelectedQeiGroupId(null);
    setSelectedTokamakGroupId(null);
    setSelectedGalacticGroupId(null);
    setSelectedCurvatureGroupId(null);
    clearStarSimObjectBinding();
    clearCosmicDistanceObjectBinding();
    clearSolarSpectrumObjectBinding();
    clearCasimirCavityObjectBinding();
    clearQeiStressEnergyObjectBinding();
    clearTokamakPlasmaObjectBinding();
    clearGalacticDynamicsObjectBinding();
    clearCurvatureCollapseObjectBinding();
    setSelectedBadgeId(null);
    setSelectedBadgeIds([]);
    useScientificCalculatorStore.getState().setTheoryLoadout(null);
    const groupBadgeIds = group.theoryBadgeIds.filter((badgeId: string) =>
      graph.badges.some((badge: TheoryBadgeV1) => badge.id === badgeId),
    );
    const highlighted = new Set(groupBadgeIds);
    const edgeIds = graph.edges
      .filter((edge: TheoryBadgeEdgeV1) => highlighted.has(edge.from) && highlighted.has(edge.to))
      .map((edge: TheoryBadgeEdgeV1) => edge.id);
    setSelectionOverlay({
      selectedBadgeIds: groupBadgeIds,
      highlightedBadgeIds: groupBadgeIds,
      highlightedEdgeIds: edgeIds,
      claimBoundaryNotes: group.claimBoundaryBadgeIds.map(
        (badgeId: string) => `${badgeId}: NHM2 diagnostic-only boundary.`,
      ),
    });
    loadTheoryRunEvidence({
      badgeIds: groupBadgeIds,
      mode: "dependency_path",
      expected: {
        activeAtlasLensId: "warp_gr_nhm2",
        selectedWarpGroupId: group.id,
      },
      preferredBadgeId: preferredEvidenceBadgeId(groupBadgeIds),
    });
  };

  const selectWarpObjectBinding = (group: WarpGrNhm2Group, bindingId: string) => {
    if (!graph) return;
    const binding = group.objectBindings.find((candidate) => candidate.id === bindingId);
    if (!binding) return;
    selectWarpGrNhm2Group(group);
    setSelectedWarpObjectBindingId(binding.id);
    const payloadIdsByBadgeId = group.calculatorPayloadRefs.reduce<Record<string, string[]>>((acc, ref) => {
      acc[ref.badgeId] = [...(acc[ref.badgeId] ?? []), ref.payloadId];
      return acc;
    }, {});
    const objectContext = buildNhm2DiagnosticObjectBindings({
      ...binding.input,
      source: "manual",
    });
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: group.theoryBadgeIds,
      mode: "selected_badges",
      source: "achievement_map",
      objectContext,
      includeContextItems: true,
      payloadIdsByBadgeId,
    });
    const scientificState = useScientificCalculatorStore.getState();
    scientificState.setTheoryLoadout(loadout);
    const firstWarpScalar =
      loadout.items.find((item) => item.kind === "calculator_payload" && item.badgeId.startsWith("nhm2.")) ??
      loadout.items.find((item) => item.kind === "calculator_payload");
    if (firstWarpScalar) scientificState.loadTheoryLoadoutItem(firstWarpScalar.index);
  };

  const clearWarpBindingSelection = () => {
    clearWarpGrNhm2ObjectBinding();
    useScientificCalculatorStore.getState().setTheoryLoadout(null);
  };

  const selectQeiStressEnergyGroup = (group: QeiStressEnergyGroup) => {
    if (!graph) return;
    setActiveAtlasLensId("qei_stress_energy");
    setSelectedQeiGroupId(group.id);
    setSelectedQeiObjectBindingId(null);
    setSelectedEvolutionStageId(null);
    setSelectedCosmicRungId(null);
    setSelectedSolarGroupId(null);
    setSelectedCasimirGroupId(null);
    setSelectedWarpGroupId(null);
    setSelectedTokamakGroupId(null);
    setSelectedGalacticGroupId(null);
    setSelectedCurvatureGroupId(null);
    clearStarSimObjectBinding();
    clearCosmicDistanceObjectBinding();
    clearSolarSpectrumObjectBinding();
    clearCasimirCavityObjectBinding();
    clearWarpGrNhm2ObjectBinding();
    clearTokamakPlasmaObjectBinding();
    clearGalacticDynamicsObjectBinding();
    clearCurvatureCollapseObjectBinding();
    setSelectedBadgeId(null);
    setSelectedBadgeIds([]);
    useScientificCalculatorStore.getState().setTheoryLoadout(null);
    const groupBadgeIds = group.theoryBadgeIds.filter((badgeId: string) =>
      graph.badges.some((badge: TheoryBadgeV1) => badge.id === badgeId),
    );
    const highlighted = new Set(groupBadgeIds);
    const edgeIds = graph.edges
      .filter((edge: TheoryBadgeEdgeV1) => highlighted.has(edge.from) && highlighted.has(edge.to))
      .map((edge: TheoryBadgeEdgeV1) => edge.id);
    setSelectionOverlay({
      selectedBadgeIds: groupBadgeIds,
      highlightedBadgeIds: groupBadgeIds,
      highlightedEdgeIds: edgeIds,
      claimBoundaryNotes: group.claimBoundaryBadgeIds.map(
        (badgeId: string) => `${badgeId}: QEI/stress diagnostic-only boundary.`,
      ),
    });
    loadTheoryRunEvidence({
      badgeIds: groupBadgeIds,
      mode: "dependency_path",
      expected: {
        activeAtlasLensId: "qei_stress_energy",
        selectedQeiGroupId: group.id,
      },
      preferredBadgeId: preferredEvidenceBadgeId(groupBadgeIds),
    });
  };

  const selectQeiObjectBinding = (group: QeiStressEnergyGroup, bindingId: string) => {
    if (!graph) return;
    const binding = group.objectBindings.find((candidate) => candidate.id === bindingId);
    if (!binding) return;
    selectQeiStressEnergyGroup(group);
    setSelectedQeiObjectBindingId(binding.id);
    const payloadIdsByBadgeId = group.calculatorPayloadRefs.reduce<Record<string, string[]>>((acc, ref) => {
      acc[ref.badgeId] = [...(acc[ref.badgeId] ?? []), ref.payloadId];
      return acc;
    }, {});
    const objectContext = buildNhm2DiagnosticObjectBindings({
      ...binding.input,
      source: "manual",
    });
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: group.theoryBadgeIds,
      mode: "selected_badges",
      source: "achievement_map",
      objectContext,
      includeContextItems: true,
      payloadIdsByBadgeId,
    });
    const scientificState = useScientificCalculatorStore.getState();
    scientificState.setTheoryLoadout(loadout);
    const firstQeiScalar =
      loadout.items.find((item) => item.kind === "calculator_payload" && item.badgeId === "nhm2.qei.sampling_window") ??
      loadout.items.find((item) => item.kind === "calculator_payload" && item.badgeId === "nhm2.closure.source_residual") ??
      loadout.items.find((item) => item.kind === "calculator_payload");
    if (firstQeiScalar) scientificState.loadTheoryLoadoutItem(firstQeiScalar.index);
  };

  const clearQeiBindingSelection = () => {
    clearQeiStressEnergyObjectBinding();
    useScientificCalculatorStore.getState().setTheoryLoadout(null);
  };

  const selectTokamakPlasmaGroup = (group: TokamakPlasmaGroup) => {
    if (!graph) return;
    setActiveAtlasLensId("tokamak_plasma");
    setSelectedTokamakGroupId(group.id);
    setSelectedTokamakObjectBindingId(null);
    setSelectedEvolutionStageId(null);
    setSelectedCosmicRungId(null);
    setSelectedSolarGroupId(null);
    setSelectedCasimirGroupId(null);
    setSelectedWarpGroupId(null);
    setSelectedQeiGroupId(null);
    setSelectedGalacticGroupId(null);
    setSelectedCurvatureGroupId(null);
    clearStarSimObjectBinding();
    clearCosmicDistanceObjectBinding();
    clearSolarSpectrumObjectBinding();
    clearCasimirCavityObjectBinding();
    clearWarpGrNhm2ObjectBinding();
    clearQeiStressEnergyObjectBinding();
    clearGalacticDynamicsObjectBinding();
    clearCurvatureCollapseObjectBinding();
    setSelectedBadgeId(null);
    setSelectedBadgeIds([]);
    useScientificCalculatorStore.getState().setTheoryLoadout(null);
    const groupBadgeIds = group.theoryBadgeIds.filter((badgeId: string) =>
      graph.badges.some((badge: TheoryBadgeV1) => badge.id === badgeId),
    );
    const highlighted = new Set(groupBadgeIds);
    const edgeIds = graph.edges
      .filter((edge: TheoryBadgeEdgeV1) => highlighted.has(edge.from) && highlighted.has(edge.to))
      .map((edge: TheoryBadgeEdgeV1) => edge.id);
    setSelectionOverlay({
      selectedBadgeIds: groupBadgeIds,
      highlightedBadgeIds: groupBadgeIds,
      highlightedEdgeIds: edgeIds,
      claimBoundaryNotes: group.claimBoundaryBadgeIds.map(
        (badgeId: string) => `${badgeId}: Tokamak diagnostic/proxy boundary.`,
      ),
    });
  };

  const selectTokamakObjectBinding = (group: TokamakPlasmaGroup, bindingId: string) => {
    if (!graph) return;
    const binding = group.objectBindings.find((candidate) => candidate.id === bindingId);
    if (!binding) return;
    selectTokamakPlasmaGroup(group);
    setSelectedTokamakObjectBindingId(binding.id);
    const payloadIdsByBadgeId = group.calculatorPayloadRefs.reduce<Record<string, string[]>>((acc, ref) => {
      acc[ref.badgeId] = [...(acc[ref.badgeId] ?? []), ref.payloadId];
      return acc;
    }, {});
    const objectContext = buildTokamakPlasmaObjectBindings({
      ...binding.input,
      source: "manual",
    });
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: group.theoryBadgeIds,
      mode: "selected_badges",
      source: "achievement_map",
      objectContext,
      includeContextItems: true,
      payloadIdsByBadgeId,
    });
    const scientificState = useScientificCalculatorStore.getState();
    scientificState.setTheoryLoadout(loadout);
    const firstTokamakScalar =
      loadout.items.find((item) => item.kind === "calculator_payload" && item.badgeId === "tokamak.plasma.magnetic_pressure") ??
      loadout.items.find((item) => item.kind === "calculator_payload" && item.badgeId.startsWith("tokamak.")) ??
      loadout.items.find((item) => item.kind === "calculator_payload");
    if (firstTokamakScalar) scientificState.loadTheoryLoadoutItem(firstTokamakScalar.index);
  };

  const clearTokamakBindingSelection = () => {
    clearTokamakPlasmaObjectBinding();
    useScientificCalculatorStore.getState().setTheoryLoadout(null);
  };

  const selectGalacticDynamicsGroup = (group: GalacticDynamicsGroup) => {
    if (!graph) return;
    setActiveAtlasLensId("galactic_dynamics");
    setSelectedGalacticGroupId(group.id);
    setSelectedGalacticObjectBindingId(null);
    setSelectedEvolutionStageId(null);
    setSelectedCosmicRungId(null);
    setSelectedSolarGroupId(null);
    setSelectedCasimirGroupId(null);
    setSelectedWarpGroupId(null);
    setSelectedQeiGroupId(null);
    setSelectedTokamakGroupId(null);
    setSelectedCurvatureGroupId(null);
    clearStarSimObjectBinding();
    clearCosmicDistanceObjectBinding();
    clearSolarSpectrumObjectBinding();
    clearCasimirCavityObjectBinding();
    clearWarpGrNhm2ObjectBinding();
    clearQeiStressEnergyObjectBinding();
    clearTokamakPlasmaObjectBinding();
    clearCurvatureCollapseObjectBinding();
    setSelectedBadgeId(null);
    setSelectedBadgeIds([]);
    useScientificCalculatorStore.getState().setTheoryLoadout(null);
    const groupBadgeIds = group.theoryBadgeIds.filter((badgeId: string) =>
      graph.badges.some((badge: TheoryBadgeV1) => badge.id === badgeId),
    );
    const highlighted = new Set(groupBadgeIds);
    const edgeIds = graph.edges
      .filter((edge: TheoryBadgeEdgeV1) => highlighted.has(edge.from) && highlighted.has(edge.to))
      .map((edge: TheoryBadgeEdgeV1) => edge.id);
    setSelectionOverlay({
      selectedBadgeIds: groupBadgeIds,
      highlightedBadgeIds: groupBadgeIds,
      highlightedEdgeIds: edgeIds,
      claimBoundaryNotes: group.claimBoundaryBadgeIds.map(
        (badgeId: string) => `${badgeId}: Galactic null-model/diagnostic boundary.`,
      ),
    });
  };

  const selectGalacticObjectBinding = (group: GalacticDynamicsGroup, bindingId: string) => {
    if (!graph) return;
    const binding = group.objectBindings.find((candidate) => candidate.id === bindingId);
    if (!binding) return;
    selectGalacticDynamicsGroup(group);
    setSelectedGalacticObjectBindingId(binding.id);
    const payloadIdsByBadgeId = group.calculatorPayloadRefs.reduce<Record<string, string[]>>((acc, ref) => {
      acc[ref.badgeId] = [...(acc[ref.badgeId] ?? []), ref.payloadId];
      return acc;
    }, {});
    const objectContext = buildGalacticDynamicsObjectBindings({
      ...binding.input,
      source: "manual",
    });
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: group.theoryBadgeIds,
      mode: "selected_badges",
      source: "achievement_map",
      objectContext,
      includeContextItems: true,
      payloadIdsByBadgeId,
    });
    const scientificState = useScientificCalculatorStore.getState();
    scientificState.setTheoryLoadout(loadout);
    const firstGalacticScalar =
      loadout.items.find((item) => item.kind === "calculator_payload" && item.badgeId === "galactic.map.distance_3d") ??
      loadout.items.find((item) => item.kind === "calculator_payload" && item.badgeId.startsWith("galactic.")) ??
      loadout.items.find((item) => item.kind === "calculator_payload");
    if (firstGalacticScalar) scientificState.loadTheoryLoadoutItem(firstGalacticScalar.index);
  };

  const clearGalacticBindingSelection = () => {
    clearGalacticDynamicsObjectBinding();
    useScientificCalculatorStore.getState().setTheoryLoadout(null);
  };

  const selectCurvatureCollapseGroup = (group: CurvatureCollapseGroup) => {
    if (!graph) return;
    setActiveAtlasLensId("curvature_collapse");
    setSelectedCurvatureGroupId(group.id);
    setSelectedCurvatureObjectBindingId(null);
    setSelectedEvolutionStageId(null);
    setSelectedCosmicRungId(null);
    setSelectedSolarGroupId(null);
    setSelectedCasimirGroupId(null);
    setSelectedWarpGroupId(null);
    setSelectedQeiGroupId(null);
    setSelectedTokamakGroupId(null);
    setSelectedGalacticGroupId(null);
    clearStarSimObjectBinding();
    clearCosmicDistanceObjectBinding();
    clearSolarSpectrumObjectBinding();
    clearCasimirCavityObjectBinding();
    clearWarpGrNhm2ObjectBinding();
    clearQeiStressEnergyObjectBinding();
    clearTokamakPlasmaObjectBinding();
    clearGalacticDynamicsObjectBinding();
    setSelectedBadgeId(null);
    setSelectedBadgeIds([]);
    useScientificCalculatorStore.getState().setTheoryLoadout(null);
    const groupBadgeIds = group.theoryBadgeIds.filter((badgeId: string) =>
      graph.badges.some((badge: TheoryBadgeV1) => badge.id === badgeId),
    );
    const highlighted = new Set(groupBadgeIds);
    const edgeIds = graph.edges
      .filter((edge: TheoryBadgeEdgeV1) => highlighted.has(edge.from) && highlighted.has(edge.to))
      .map((edge: TheoryBadgeEdgeV1) => edge.id);
    setSelectionOverlay({
      selectedBadgeIds: groupBadgeIds,
      highlightedBadgeIds: groupBadgeIds,
      highlightedEdgeIds: edgeIds,
      claimBoundaryNotes: group.claimBoundaryBadgeIds.map(
        (badgeId: string) => `${badgeId}: Curvature/collapse benchmark boundary.`,
      ),
    });
  };

  const selectCurvatureObjectBinding = (group: CurvatureCollapseGroup, bindingId: string) => {
    if (!graph) return;
    const binding = group.objectBindings.find((candidate) => candidate.id === bindingId);
    if (!binding) return;
    selectCurvatureCollapseGroup(group);
    setSelectedCurvatureObjectBindingId(binding.id);
    const payloadIdsByBadgeId = group.calculatorPayloadRefs.reduce<Record<string, string[]>>((acc, ref) => {
      acc[ref.badgeId] = [...(acc[ref.badgeId] ?? []), ref.payloadId];
      return acc;
    }, {});
    const objectContext = buildCurvatureCollapseObjectBindings({
      ...binding.input,
      source: "manual",
    });
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: group.theoryBadgeIds,
      mode: "selected_badges",
      source: "achievement_map",
      objectContext,
      includeContextItems: true,
      payloadIdsByBadgeId,
    });
    const scientificState = useScientificCalculatorStore.getState();
    scientificState.setTheoryLoadout(loadout);
    const firstCurvatureScalar =
      loadout.items.find((item) => item.kind === "calculator_payload" && item.badgeId === "curvature.proxy.body_density") ??
      loadout.items.find(
        (item) =>
          item.kind === "calculator_payload" &&
          (item.badgeId.startsWith("curvature.") || item.badgeId.startsWith("collapse.")),
      ) ??
      loadout.items.find((item) => item.kind === "calculator_payload");
    if (firstCurvatureScalar) scientificState.loadTheoryLoadoutItem(firstCurvatureScalar.index);
  };

  const clearCurvatureBindingSelection = () => {
    clearCurvatureCollapseObjectBinding();
    useScientificCalculatorStore.getState().setTheoryLoadout(null);
  };

  const hasSavedLensSelection = (lensId: TheoryAtlasLensId) => {
    switch (lensId) {
      case "stellar_evolution":
        return Boolean(selectedEvolutionStageId);
      case "cosmic_distance_ladder":
        return Boolean(selectedCosmicRungId);
      case "solar_surface_spectrum":
        return Boolean(selectedSolarGroupId);
      case "casimir_cavity_modes":
        return Boolean(selectedCasimirGroupId);
      case "warp_gr_nhm2":
        return Boolean(selectedWarpGroupId);
      case "qei_stress_energy":
        return Boolean(selectedQeiGroupId);
      case "tokamak_plasma":
        return Boolean(selectedTokamakGroupId);
      case "galactic_dynamics":
        return Boolean(selectedGalacticGroupId);
      case "curvature_collapse":
        return Boolean(selectedCurvatureGroupId);
      default:
        return false;
    }
  };

  const runPathToBadge = (badgeId: string) => {
    if (!graph) return;
    void playbackStore.runPlayback({
      graph,
      targetBadgeId: badgeId,
    });
  };

  const loadTheoryRunForBadgeIds = (badgeIds: string[]) => {
    loadTheoryRunEvidence({
      badgeIds,
      mode: "dependency_path",
      preferredBadgeId: preferredEvidenceBadgeId(badgeIds),
      openWorkbench: true,
    });
  };

  const loadSelectedTheoryRun = () => {
    if (!selectedBadge) return;
    loadTheoryRunForBadgeIds([selectedBadge.id]);
  };

  const selectAtlasLens = (lensId: TheoryAtlasLensId) => {
    if (activeLensId === lensId) {
      setActiveAtlasLensId(null);
      useTheoryCompoundRunStore.getState().clearTheoryRun();
      return;
    }
    const shouldRestoreCollapsedLens = activeLensId === null && hasSavedLensSelection(lensId);
    setActiveAtlasLensId(lensId);
    useTheoryCompoundRunStore.getState().clearTheoryRun();
    if (!shouldRestoreCollapsedLens) {
      setSelectedBadgeId(null);
      setSelectedBadgeIds([]);
      setSelectedEvolutionStageId(null);
      setSelectedCosmicRungId(null);
      setSelectedSolarGroupId(null);
      setSelectedCasimirGroupId(null);
      setSelectedWarpGroupId(null);
      setSelectedQeiGroupId(null);
      setSelectedTokamakGroupId(null);
      setSelectedGalacticGroupId(null);
      setSelectedCurvatureGroupId(null);
      clearStarSimObjectBinding();
      clearCosmicDistanceObjectBinding();
      clearSolarSpectrumObjectBinding();
      clearCasimirCavityObjectBinding();
      clearWarpGrNhm2ObjectBinding();
      clearQeiStressEnergyObjectBinding();
      clearTokamakPlasmaObjectBinding();
      clearGalacticDynamicsObjectBinding();
      clearCurvatureCollapseObjectBinding();
    }
    if (!graph) return;
    const lens = resolvePhysicsAtlasLens({
      graph,
      atlas: buildHelixPhysicsAtlasV1({ graph }),
      blockId: lensId,
    });
    setSelectionOverlay({
      selectedBadgeIds: lens.centerBadgeIds,
      highlightedBadgeIds: lens.highlightedBadgeIds,
      highlightedEdgeIds: lens.highlightedEdgeIds,
      claimBoundaryNotes: lens.claimBoundaryNotes,
    });
  };

  const selectLiveAnswerContext = () => {
    if (!mapOverlay.liveAnswerContextReflection) return;
    setActiveAtlasLensId(null);
    restoreLiveAnswerContextOverlay();
  };

  if (viewMode === "map") {
    return (
      <div className="relative flex h-full min-h-0 overflow-hidden bg-zinc-900 text-zinc-950">
        <TheoryAtlasRail
          activeLensId={activeLensId}
          hasLiveReflection={Boolean(mapOverlay.liveAnswerContextReflection)}
          liveReflectionActive={
            mapOverlay.source === "discussion_reflection" &&
            Boolean(mapOverlay.liveAnswerContextReflection) &&
            mapOverlay.reflectionOverlay === mapOverlay.liveAnswerContextReflection
          }
          onSelectLiveReflection={selectLiveAnswerContext}
          onSelectLens={selectAtlasLens}
        />
        <div
          data-testid="theory-atlas-lens-overlay"
          className="absolute bottom-0 left-9 top-0 z-30 flex shadow-2xl"
        >
        {activeLensId === "stellar_evolution" && graph ? (
          <StellarEvolutionLens
            graph={graph}
            stages={STARSIM_STELLAR_EVOLUTION_STAGES}
            selectedStageId={selectedEvolutionStageId}
            selectedObjectBindingId={selectedObjectBindingId}
            onSelectStage={selectEvolutionStage}
            onSelectObjectBinding={selectStarSimObjectBinding}
            onClearObjectBinding={clearStarSimBindingSelection}
            onLoadPayload={loadCalculatorPayload}
          />
        ) : null}
        {activeLensId === "cosmic_distance_ladder" && graph ? (
          <CosmicDistanceLadderLens
            graph={graph}
            rungs={COSMIC_DISTANCE_LADDER_RUNGS}
            selectedRungId={selectedCosmicRungId}
            selectedObjectBindingId={selectedCosmicObjectBindingId}
            onSelectRung={selectCosmicDistanceRung}
            onSelectObjectBinding={selectCosmicObjectBinding}
            onClearObjectBinding={clearCosmicBindingSelection}
            onLoadPayload={loadCalculatorPayload}
          />
        ) : null}
        {activeLensId === "solar_surface_spectrum" && graph ? (
          <SolarSpectrumLens
            graph={graph}
            groups={SOLAR_SPECTRUM_OBSERVATION_GROUPS}
            selectedGroupId={selectedSolarGroupId}
            selectedObjectBindingId={selectedSolarObjectBindingId}
            onSelectGroup={selectSolarSpectrumGroup}
            onSelectObjectBinding={selectSolarObjectBinding}
            onClearObjectBinding={clearSolarBindingSelection}
            onLoadPayload={loadCalculatorPayload}
          />
        ) : null}
        {activeLensId === "casimir_cavity_modes" && graph ? (
          <CasimirCavityLens
            graph={graph}
            groups={CASIMIR_CAVITY_GROUPS}
            selectedGroupId={selectedCasimirGroupId}
            selectedObjectBindingId={selectedCasimirObjectBindingId}
            onSelectGroup={selectCasimirCavityGroup}
            onSelectObjectBinding={selectCasimirObjectBinding}
            onClearObjectBinding={clearCasimirBindingSelection}
            onLoadPayload={loadCalculatorPayload}
          />
        ) : null}
        {activeLensId === "warp_gr_nhm2" && graph ? (
          <WarpGrNhm2Lens
            graph={graph}
            groups={WARP_GR_NHM2_GROUPS}
            selectedGroupId={selectedWarpGroupId}
            selectedObjectBindingId={selectedWarpObjectBindingId}
            onSelectGroup={selectWarpGrNhm2Group}
            onSelectObjectBinding={selectWarpObjectBinding}
            onClearObjectBinding={clearWarpBindingSelection}
            onLoadPayload={loadCalculatorPayload}
          />
        ) : null}
        {activeLensId === "qei_stress_energy" && graph ? (
          <QeiStressEnergyLens
            graph={graph}
            groups={QEI_STRESS_ENERGY_GROUPS}
            selectedGroupId={selectedQeiGroupId}
            selectedObjectBindingId={selectedQeiObjectBindingId}
            onSelectGroup={selectQeiStressEnergyGroup}
            onSelectObjectBinding={selectQeiObjectBinding}
            onClearObjectBinding={clearQeiBindingSelection}
            onLoadPayload={loadCalculatorPayload}
          />
        ) : null}
        {activeLensId === "tokamak_plasma" && graph ? (
          <TokamakPlasmaLens
            graph={graph}
            groups={TOKAMAK_PLASMA_GROUPS}
            selectedGroupId={selectedTokamakGroupId}
            selectedObjectBindingId={selectedTokamakObjectBindingId}
            onSelectGroup={selectTokamakPlasmaGroup}
            onSelectObjectBinding={selectTokamakObjectBinding}
            onClearObjectBinding={clearTokamakBindingSelection}
            onLoadPayload={loadCalculatorPayload}
          />
        ) : null}
        {activeLensId === "galactic_dynamics" && graph ? (
          <GalacticDynamicsLens
            graph={graph}
            groups={GALACTIC_DYNAMICS_GROUPS}
            selectedGroupId={selectedGalacticGroupId}
            selectedObjectBindingId={selectedGalacticObjectBindingId}
            onSelectGroup={selectGalacticDynamicsGroup}
            onSelectObjectBinding={selectGalacticObjectBinding}
            onClearObjectBinding={clearGalacticBindingSelection}
            onLoadPayload={loadCalculatorPayload}
          />
        ) : null}
        {activeLensId === "curvature_collapse" && graph ? (
          <CurvatureCollapseLens
            graph={graph}
            groups={CURVATURE_COLLAPSE_GROUPS}
            selectedGroupId={selectedCurvatureGroupId}
            selectedObjectBindingId={selectedCurvatureObjectBindingId}
            onSelectGroup={selectCurvatureCollapseGroup}
            onSelectObjectBinding={selectCurvatureObjectBinding}
            onClearObjectBinding={clearCurvatureBindingSelection}
            onLoadPayload={loadCalculatorPayload}
          />
        ) : null}
        {activeLensId &&
        activeLensId !== "stellar_evolution" &&
        activeLensId !== "cosmic_distance_ladder" &&
        activeLensId !== "solar_surface_spectrum" &&
        activeLensId !== "casimir_cavity_modes" &&
        activeLensId !== "warp_gr_nhm2" &&
        activeLensId !== "qei_stress_energy" &&
        activeLensId !== "tokamak_plasma" &&
        activeLensId !== "galactic_dynamics" &&
        activeLensId !== "curvature_collapse" &&
        graph &&
        atlasLens &&
        activeAtlasBlock ? (
          <PhysicsAtlasBlockLens
            graph={graph}
            block={activeAtlasBlock}
            lens={atlasLens}
            onSelectBadge={selectBadge}
            onLoadPayload={loadCalculatorPayload}
          />
        ) : null}
        </div>
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
                  exactBadgeIds={[]}
                  likelyBadgeIds={[]}
                  softRegions={[]}
                  playbackBadgeIds={playbackBadgeIds}
                  solvedBadgeIds={solvedBadgeIds}
                  failedBadgeIds={failedBadgeIds}
                  rippleBadgeIds={mapOverlay.rippleBadgeIds}
                  heatByBadgeId={mapOverlay.heatByBadgeId}
                  probabilityTerrain={theoryProbabilityTerrain}
                  frontierTrace={seedAtlasFrontierTrace}
                  routeBadgeLabels={routeBadgeLabels}
                  activeAtlasLensId={rememberedAtlasLensId}
                  onSelectBadge={selectBadge}
                  onToggleBadgeSelection={toggleBadgeSelection}
                  onClearSelection={() => {
                    setSelectedBadgeId(null);
                    setSelectedBadgeIds([]);
                  }}
                  onRunPath={runPathToBadge}
                  onLoadCalculatorPayload={loadCalculatorPayload}
                  viewport={viewport}
                  onViewportChange={rememberViewport}
                />
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
              Physics theory badges, unit signatures, assumptions, artifact-backed runs, and scalar loadouts.
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
              onLoadTheoryRun={loadSelectedTheoryRun}
              onClearPlayback={playbackStore.clearPlayback}
            />
          </div>
        </div>
      )}
    </div>
  );
}
