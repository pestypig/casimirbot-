import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { HelixRecommendedActionAdmissionV1 } from "@shared/contracts/helix-recommended-action-admission.v1";
import type { CharacterSituationComparisonV1 } from "@shared/character-situation-comparison";
import type { IdeologyContextReflectionV1 } from "@shared/ideology-context-reflection";
import type { MoralBadgeLocatorV1 } from "@shared/moral-badge-locator";
import { calculateFruitionFromReflection } from "@shared/moral-graph/calculate-fruition";
import {
  moralRenderChunkForLocation,
  moralRenderChunkForNode,
  moralSemanticChunkForLocation,
  moralSemanticChunkForNode,
} from "@shared/moral-graph/moral-probability-chunks";
import type { FruitionProcedureExpressionV1 } from "@shared/fruition-procedure-expression";
import { useFruitionCalculatorStore } from "@/store/useFruitionCalculatorStore";
import { useMoralGraphCurrentAnswerStore } from "@/store/useMoralGraphCurrentAnswerStore";
import type { MoralGraphCurrentAnswerBlock } from "@/lib/moral-graph/currentAnswerBlock";
import ProbabilityTerrainOverlay from "@/components/graphs/ProbabilityTerrainOverlay";
import MoralGraphBiomeMap from "@/components/panels/moral-graph/MoralGraphBiomeMap";
import { buildMoralGraphBiomeScaleViewModel } from "@/lib/moral-graph/biomeScaleViewModel";
import { buildMoralGraphSelectionTraceViewModel } from "@/lib/moral-graph/selectionTraceViewModel";

const MORAL_GRAPH_MAX_ZOOM = 1.35;
const MORAL_GRAPH_MIN_ZOOM_FLOOR = 0.22;
const MORAL_GRAPH_ZOOM_STEP = 1.22;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

type MoralGraphNodeTone = "root" | "principle" | "lens" | "trait" | "safeguard" | "boundary" | "action" | "objective" | "character";

type MoralGraphNode = {
  id: string;
  label: string;
  tone: MoralGraphNodeTone;
  glyph: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  confidence?: number;
  tags?: string[];
  summary: string;
  proceduralExpression?: string;
  proceduralRole?: string;
  procedureOperator?: string;
  actionEffect?: string;
  evidenceNeeds?: string[];
  refusesAuthority?: string[];
  characterWeights?: CharacterSituationComparisonV1["activatedProfileWeights"];
  characterHypothesis?: CharacterSituationComparisonV1["behavioralHypothesis"];
};

type MoralObjectiveLensId = "wisdom" | "character" | "answer";

type MoralGraphTerrainNode = MoralGraphNode & {
  renderChunkId: string;
  semanticChunkId: string;
};

type MoralGraphTerrainChunk = {
  id: string;
  bounds: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
};

const MORAL_OBJECTIVE_LENSES: Array<{
  id: MoralObjectiveLensId;
  glyph: string;
  label: string;
  title: string;
  tone: string;
}> = [
  { id: "wisdom", glyph: "W", label: "Wisdom", title: "Wisdom objective binding lens", tone: "bg-violet-700" },
  { id: "character", glyph: "C", label: "Character", title: "Character objective binding lens", tone: "bg-red-800" },
  { id: "answer", glyph: "A", label: "Answer", title: "Current answer binding lens", tone: "bg-cyan-800" },
];

function labelize(value: string): string {
  return value.replace(/[_-]/g, " ");
}

function buildLocatorChunkMap(locator: MoralBadgeLocatorV1 | undefined, rootId: string) {
  const chunksByNodeId = new Map<string, { renderChunkId: string; semanticChunkId: string }>();
  if (!locator) return chunksByNodeId;
  const locations = [
    ...locator.locatedBadges.exact,
    ...locator.locatedBadges.likely,
    ...locator.locatedBadges.inferred,
  ];
  for (const location of locations) {
    chunksByNodeId.set(location.nodeId, {
      renderChunkId: moralRenderChunkForLocation({ rootId, location }),
      semanticChunkId: moralSemanticChunkForLocation(location),
    });
  }
  return chunksByNodeId;
}

function buildMoralTerrainNodes(args: {
  nodes: MoralGraphNode[];
  locator?: MoralBadgeLocatorV1;
  rootId: string;
}): MoralGraphTerrainNode[] {
  const locatorChunks = buildLocatorChunkMap(args.locator, args.rootId);
  return args.nodes.map((node) => {
    const located = locatorChunks.get(node.id);
    return {
      ...node,
      renderChunkId:
        located?.renderChunkId ??
        moralRenderChunkForNode({
          rootId: args.rootId,
          node,
        }),
      semanticChunkId: located?.semanticChunkId ?? moralSemanticChunkForNode(node),
    };
  });
}

function buildMoralTerrainChunks(nodes: MoralGraphTerrainNode[]): MoralGraphTerrainChunk[] {
  const groups = new Map<string, MoralGraphTerrainNode[]>();
  for (const node of nodes) {
    const current = groups.get(node.renderChunkId) ?? [];
    current.push(node);
    groups.set(node.renderChunkId, current);
  }

  return [...groups.entries()]
    .map(([id, chunkNodes]) => {
      const padding = Math.max(76, 34 + chunkNodes.length * 8);
      const x0 = Math.min(...chunkNodes.map((node) => node.x)) - padding;
      const y0 = Math.min(...chunkNodes.map((node) => node.y)) - padding;
      const x1 = Math.max(...chunkNodes.map((node) => node.x + (node.width ?? 48))) + padding;
      const y1 = Math.max(...chunkNodes.map((node) => node.y + (node.height ?? 48))) + padding;
      return {
        id,
        bounds: {
          x0: Math.max(0, x0),
          y0: Math.max(0, y0),
          x1,
          y1,
        },
      };
    })
    .sort((left, right) => left.id.localeCompare(right.id));
}

function proceduralToken(value: string): string {
  return value.replace(/[^a-z0-9_-]+/gi, "_");
}

function proceduralSubjectForNode(node: Pick<MoralGraphNode, "id" | "tone">): string {
  if (node.tone === "root") return `root.${proceduralToken(node.id)}`;
  if (node.tone === "principle") return `principle.${proceduralToken(node.id)}`;
  if (node.tone === "objective") return `objective.${proceduralToken(node.id)}`;
  if (node.tone === "character") return `character.${proceduralToken(node.id)}`;
  if (node.tone === "safeguard") return `gate.${proceduralToken(node.id)}`;
  if (node.tone === "boundary") return `missing.${proceduralToken(node.id.replace(/^missing:/, ""))}`;
  if (node.tone === "action") return `action.${proceduralToken(node.id.replace(/^action:/, ""))}`;
  return `lens.${proceduralToken(node.id)}`;
}

function fallbackProcedureExpression(node: MoralGraphNode): string {
  const operator = node.procedureOperator ?? (node.tone === "boundary" || node.tone === "safeguard" ? "requires" : "supports");
  return `${proceduralSubjectForNode(node)} ${labelize(operator)} result.procedural_posture`;
}

function selectedCombinationOutcome(nodes: MoralGraphNode[]): { posture: string; label: string } {
  if (nodes.some((node) => node.tone === "boundary" || node.procedureOperator === "blocks")) {
    return { posture: "blocked_or_missing_check", label: "Selected badges route toward a blocked or missing-check posture." };
  }
  if (nodes.some((node) => node.tone === "safeguard" || node.procedureOperator === "requires" || node.procedureOperator === "asks_for")) {
    return { posture: "requires_check", label: "Selected badges require checks before the procedure can advance." };
  }
  if (nodes.some((node) => node.procedureOperator === "constrains" || node.procedureOperator === "balances")) {
    return { posture: "constrained_action_posture", label: "Selected badges constrain or balance the action posture." };
  }
  return { posture: "supported_action_posture", label: "Selected badges support the current procedural posture." };
}

function selectedCombinationExpression(nodes: MoralGraphNode[]): string {
  if (nodes.length === 0) return "No selected badge combination.";
  const outcome = selectedCombinationOutcome(nodes);
  return `${nodes.map((node) => node.proceduralExpression ?? fallbackProcedureExpression(node)).join(" + ")} => ${outcome.posture}`;
}

function BindingBox({
  title,
  label,
  children,
  tone,
  activeNodeIds,
  onSelectNode,
}: {
  title: string;
  label?: string;
  children: React.ReactNode;
  tone: "cyan" | "emerald" | "amber" | "rose" | "violet" | "slate";
  activeNodeIds?: string[];
  onSelectNode?: (id: string) => void;
}) {
  const classes =
    tone === "cyan"
      ? "border-cyan-700 bg-cyan-950/35 text-cyan-50"
      : tone === "emerald"
        ? "border-emerald-700 bg-emerald-950/35 text-emerald-50"
      : tone === "amber"
        ? "border-amber-700 bg-amber-950/35 text-amber-50"
      : tone === "rose"
        ? "border-rose-800 bg-rose-950/35 text-rose-50"
      : tone === "violet"
        ? "border-violet-700 bg-violet-950/30 text-violet-50"
        : "border-slate-800 bg-slate-900/70 text-slate-100";
  return (
    <section className={`rounded-md border p-2 ${classes}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide opacity-80">{title}</h3>
        {label ? (
          <span className="rounded border border-current/25 px-2 py-0.5 text-[10px] uppercase tracking-wide opacity-75">
            {label}
          </span>
        ) : null}
      </div>
      <div className="mt-1 text-[11px] leading-relaxed">{children}</div>
      {activeNodeIds?.length ? (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {Array.from(new Set(activeNodeIds)).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onSelectNode?.(id)}
              className="max-w-full truncate rounded border border-current/25 bg-black/20 px-1.5 py-0.5 font-mono text-[9px] opacity-85"
            >
              {id}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ObjectiveBindingRail({
  activeLensId,
  reflection,
  admission,
  fruition,
  locator,
  characterComparison,
  currentAnswer,
  selectedNode,
  selectedNodes,
  onSelectNode,
  onLoadFruition,
}: {
  activeLensId: MoralObjectiveLensId;
  reflection: IdeologyContextReflectionV1;
  admission: HelixRecommendedActionAdmissionV1;
  fruition: FruitionProcedureExpressionV1;
  locator?: MoralBadgeLocatorV1;
  characterComparison?: CharacterSituationComparisonV1;
  currentAnswer?: MoralGraphCurrentAnswerBlock | null;
  selectedNode: MoralGraphNode | null;
  selectedNodes: MoralGraphNode[];
  onSelectNode: (id: string) => void;
  onLoadFruition: () => void;
}) {
  const activeLensIds = Array.from(new Set([
    ...reflection.matches.exact.map((match) => match.nodeId),
    ...reflection.matches.likely.map((match) => match.nodeId),
    ...reflection.matches.inferred_lenses.map((match) => match.nodeId),
    ...reflection.activated_traits.map((trait) => trait.nodeId),
  ]));
  const selectedPath =
    selectedNode?.id
      ? [
          ...reflection.activated_traits.map((trait) => ({ nodeId: trait.nodeId, pathToRoot: trait.pathToRoot })),
          ...reflection.matches.exact.map((match) => ({ nodeId: match.nodeId, pathToRoot: match.pathToRoot ?? [] })),
          ...reflection.matches.likely.map((match) => ({ nodeId: match.nodeId, pathToRoot: match.pathToRoot ?? [] })),
          ...reflection.matches.inferred_lenses.map((match) => ({ nodeId: match.nodeId, pathToRoot: match.pathToRoot ?? [] })),
        ].find((entry) => entry.nodeId === selectedNode.id)?.pathToRoot ?? []
      : [];
  const presetPath = selectedPath.length
    ? selectedPath
    : (reflection.activated_traits[0]?.pathToRoot ?? reflection.matches.exact[0]?.pathToRoot ?? []);
  const missingChecks = reflection.claim_boundaries.missing_evidence ?? [];
  const askUserActions = admission.actions.filter((action) => action.admission === "ask_user");
  const blockedActions = admission.actions.filter((action) => action.admission === "blocked");
  const firstAction = admission.actions[0] ?? null;
  const selectedProcedure = selectedNode?.proceduralRole
    ? `${labelize(selectedNode.proceduralRole)} ${selectedNode.procedureOperator ? `-> ${labelize(selectedNode.procedureOperator)}` : ""}`
    : "No procedure role mapped.";
  const selectedProcedureExpression = selectedNode?.proceduralExpression ?? "No procedural expression mapped.";
  const combinationOutcome = selectedCombinationOutcome(selectedNodes);
  const combinationExpression = selectedCombinationExpression(selectedNodes);
  const activeLens = MORAL_OBJECTIVE_LENSES.find((lens) => lens.id === activeLensId) ?? MORAL_OBJECTIVE_LENSES[0];
  return (
    <aside
      data-testid="moral-graph-objective-binding-overlay"
      className="pointer-events-auto absolute bottom-3 left-9 top-3 z-30 flex w-64 shrink-0 flex-col border border-zinc-800 bg-zinc-950/95 text-zinc-100 shadow-2xl"
    >
      <div className="border-b border-zinc-800 p-2.5">
        <div className="text-xs font-semibold uppercase tracking-wide text-cyan-200">Objective Bindings</div>
        <h2 className="mt-0.5 text-base font-semibold leading-tight">MoralGraph {activeLens.label}</h2>
        <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-400">
          {activeLensId === "character"
            ? "A modeled figure is a subject binding: active badges, constraints, and procedural trace stay together."
            : activeLensId === "answer"
              ? "The current answer is a read-only block: final draft, tool receipt, activated nodes, and authority boundary stay together."
              : "Wisdom is the subject binding: objective state, constraints, selected badges, and procedural trace stay together."}
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
        {activeLensId === "wisdom" ? (
          <>
            <BindingBox title="Subject" label="objective binding" tone="slate" activeNodeIds={[reflection.graph.rootId]} onSelectNode={onSelectNode}>
              {labelize(reflection.graph.rootId)} is assembled from primitive design-language badges.
            </BindingBox>
            <BindingBox title="Objective state" label={labelize(fruition.result.posture)} tone="violet">
              <div className="space-y-1">
                <div className="text-[11px] opacity-80">{fruition.result.label}</div>
                <button
                  type="button"
                  onClick={onLoadFruition}
                  className="mt-2 w-full rounded border border-violet-500/70 bg-violet-950/70 px-2 py-1 text-left text-[10px] font-semibold uppercase tracking-wide text-violet-100 hover:border-violet-200"
                >
                  Load to Fruition Calculator
                </button>
              </div>
            </BindingBox>
            <BindingBox title="Bindings" label="primitive to subject" tone="emerald" activeNodeIds={presetPath} onSelectNode={onSelectNode}>
              {presetPath.length > 0
                ? presetPath.map((nodeId) => labelize(nodeId)).join(" -> ")
                : "No preset path is available for the selected badge."}
            </BindingBox>
            <BindingBox title="Activated lenses" label="prompt state" tone="cyan" activeNodeIds={activeLensIds} onSelectNode={onSelectNode}>
              {activeLensIds.length > 0
                ? reflection.matches.inferred_lenses.concat(reflection.matches.exact, reflection.matches.likely).slice(0, 3).map((match) => match.label).join(" / ")
                : "No deterministic lens badge is active."}
            </BindingBox>
            <BindingBox title="Badge procedure" label={selectedNode?.proceduralRole ? labelize(selectedNode.proceduralRole) : "unmapped"} tone="cyan">
              <div className="space-y-1">
                <div className="font-mono text-[10px] leading-snug text-cyan-100">{selectedProcedureExpression}</div>
                <div className="text-[11px] opacity-80">{selectedProcedure}</div>
                <div className="text-[11px] opacity-80">
                  {selectedNode?.actionEffect ?? "Select a mapped badge to inspect how it contributes to the procedural action."}
                </div>
                {selectedNode?.evidenceNeeds?.length ? (
                  <div className="text-[11px] opacity-80">Needs: {selectedNode.evidenceNeeds.map(labelize).join(", ")}</div>
                ) : null}
                {selectedNode?.refusesAuthority?.length ? (
                  <div className="text-[11px] opacity-80">Refuses: {selectedNode.refusesAuthority.map(labelize).join(", ")}</div>
                ) : null}
              </div>
            </BindingBox>
            <BindingBox
              title="Safeguards"
              label="gate edges"
              tone="amber"
              activeNodeIds={(reflection.action_gate_warnings ?? []).map((warning) => warning.gateId)}
              onSelectNode={onSelectNode}
            >
              {(reflection.action_gate_warnings ?? []).length > 0
                ? (reflection.action_gate_warnings ?? []).map((warning) => warning.requiredCheck ?? warning.warning).join(", ")
                : "No nearby safeguard badge is active."}
            </BindingBox>
            <div className="grid grid-cols-2 gap-2">
              <BindingBox title="Possible tensions" label="zone" tone="violet">
                {reflection.tensions?.length
                  ? reflection.tensions.map((tension) => tension.description).join(" ")
                  : "No possible tension zone is flagged."}
              </BindingBox>
              <BindingBox
                title="Claim boundaries"
                label="diagnostic only"
                tone="rose"
                activeNodeIds={missingChecks.map((item) => `missing:${item}`)}
                onSelectNode={onSelectNode}
              >
                {missingChecks.length > 0
                  ? missingChecks.map((item) => `Missing check: ${labelize(item)}`).join(" | ")
                  : "No missing check listed."}
              </BindingBox>
            </div>
            <BindingBox
              title="Procedural trace"
              label={`${selectedNodes.length} badge${selectedNodes.length === 1 ? "" : "s"}`}
              tone="emerald"
              activeNodeIds={selectedNodes.map((node) => node.id)}
              onSelectNode={onSelectNode}
            >
              <div className="space-y-1">
                <div className="font-mono text-[10px] leading-snug text-emerald-100">{combinationExpression}</div>
                <div className="text-[11px] opacity-80">{combinationOutcome.label}</div>
                <div className="font-mono text-[10px] leading-snug text-violet-100">{fruition.expression}</div>
              </div>
            </BindingBox>
            <BindingBox title="Authority boundary" label="evidence only" tone="slate">
              <div className="space-y-1">
                <div className="text-xs font-semibold">
                  {selectedNode ? selectedNode.label : "No outer objective badge selected"}
                </div>
                <div className="text-[11px] opacity-80">
                  {selectedNode?.summary ?? "Select a badge to inspect its objective role."}
                </div>
                <div className="text-[11px] opacity-80">
                  Admission state: {admission.summary.autoCount} auto / {admission.summary.askUserCount} ask user / {admission.summary.blockedCount} blocked
                </div>
                <div className="truncate text-[11px] opacity-80">
                  Evidence refs: {(admission.evidenceRefs ?? []).length > 0 ? admission.evidenceRefs?.join(", ") : "none"}
                </div>
                <div className="text-[11px] opacity-80">
                  Recommended next step: {firstAction ? firstAction.label : "none"}
                </div>
                <div className="text-[11px] opacity-80">
                  Risk: {labelize(firstAction?.risk ?? "unknown")} / Display policy: {labelize(firstAction?.display_policy ?? "diagnostic_only")}
                </div>
                <div className="flex flex-wrap gap-1 text-[10px]">
                  {askUserActions.length > 0 ? <span className="rounded border border-amber-600 px-1.5 py-0.5 text-amber-100">Ask user</span> : null}
                  {blockedActions.length > 0 ? <span className="rounded border border-rose-600 px-1.5 py-0.5 text-rose-100">Blocked</span> : null}
                  <span className="rounded border border-cyan-700 px-1.5 py-0.5 text-cyan-100">Evidence only</span>
                </div>
              </div>
            </BindingBox>
          </>
        ) : null}
        {activeLensId === "character" && characterComparison ? (
          <BindingBox
            title="Subject"
            label={
              characterComparison.characterId === "logh.reinhard_von_lohengramm"
                ? "Reinhard von Lohengramm"
                : labelize(characterComparison.characterId)
            }
            tone="amber"
            activeNodeIds={[
              `character:${characterComparison.characterId}`,
              ...characterComparison.activatedProfileWeights.slice(0, 5).map((entry) => entry.nodeId),
            ]}
            onSelectNode={onSelectNode}
          >
            <div className="space-y-2">
              <div className="font-semibold text-amber-50">
                {characterComparison.characterId === "logh.reinhard_von_lohengramm"
                  ? "Reinhard von Lohengramm"
                  : labelize(characterComparison.characterId)}
              </div>
              <div className="rounded border border-amber-500/50 bg-amber-950/40 p-2">
                <div className="text-[9px] font-semibold uppercase tracking-wide text-amber-200">Objective state</div>
                <div className="text-[11px] opacity-90">{characterComparison.behavioralHypothesis.likelyChoice}</div>
              </div>
              <div className="rounded border border-amber-500/40 bg-black/20 p-2">
                <div className="text-[9px] font-semibold uppercase tracking-wide text-amber-200">Bindings</div>
                <div className="font-mono text-[10px] leading-snug text-amber-100">
                  character.{proceduralToken(characterComparison.characterId)} weights activated badges =&gt;{" "}
                  {labelize(characterComparison.predictedPosture)}
                </div>
                {characterComparison.matchedRules.slice(0, 3).map((rule) => (
                  <div key={rule.id} className="mt-1 text-[10px] opacity-80">
                    {labelize(rule.id)} -&gt; {labelize(rule.posture)} ({rule.confidence.toFixed(2)})
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {characterComparison.activatedProfileWeights.slice(0, 4).map((entry) => (
                  <span key={entry.nodeId} className="rounded border border-amber-500/40 bg-black/20 px-1.5 py-0.5 text-[9px]">
                    {labelize(entry.nodeId)} {entry.characterWeight.toFixed(2)}
                  </span>
                ))}
              </div>
              <div className="rounded border border-rose-500/40 bg-black/20 p-2">
                <div className="text-[9px] font-semibold uppercase tracking-wide text-rose-200">Authority boundary</div>
                <div className="text-[11px] opacity-80">
                  Missing: {characterComparison.behavioralHypothesis.missingEvidence.map(labelize).join(", ")}
                </div>
              </div>
            </div>
          </BindingBox>
        ) : null}
        {activeLensId === "character" && !characterComparison ? (
          <BindingBox title="Subject" label="no character binding" tone="amber">
            No character preset comparison is attached to this graph view.
          </BindingBox>
        ) : null}
        {activeLensId === "answer" && currentAnswer ? (
          <>
            <BindingBox
              title="Current answer"
              label={currentAnswer.terminalArtifactKind}
              tone="cyan"
              activeNodeIds={currentAnswer.activatedNodeIds}
              onSelectNode={onSelectNode}
            >
              <div className="space-y-2">
                <div className="rounded border border-cyan-500/50 bg-cyan-950/40 p-2">
                  <div className="text-[9px] font-semibold uppercase tracking-wide text-cyan-200">Final answer block</div>
                  <div className="mt-1 max-h-28 overflow-y-auto whitespace-pre-wrap pr-1 text-[11px] leading-relaxed text-cyan-50">
                    {currentAnswer.finalAnswer || "No final answer text captured in the debug export."}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="rounded border border-cyan-500/35 bg-black/20 p-1.5">
                    <div className="uppercase tracking-wide text-cyan-200">Source</div>
                    <div className="mt-0.5 font-mono text-cyan-50">{currentAnswer.finalAnswerSource}</div>
                  </div>
                  <div className="rounded border border-cyan-500/35 bg-black/20 p-1.5">
                    <div className="uppercase tracking-wide text-cyan-200">Route</div>
                    <div className="mt-0.5 font-mono text-cyan-50">{currentAnswer.route}</div>
                  </div>
                </div>
                <div className="rounded border border-cyan-500/35 bg-black/20 p-2">
                  <div className="text-[9px] font-semibold uppercase tracking-wide text-cyan-200">Prompt</div>
                  <div className="mt-1 max-h-16 overflow-y-auto text-[11px] leading-relaxed opacity-85">
                    {currentAnswer.prompt || "No prompt captured."}
                  </div>
                </div>
              </div>
            </BindingBox>
            <BindingBox
              title="Activated nodes"
              label={`${currentAnswer.activatedNodeIds.length} nodes`}
              tone="emerald"
              activeNodeIds={currentAnswer.activatedNodeIds}
              onSelectNode={onSelectNode}
            >
              {currentAnswer.activatedLabels.length > 0
                ? currentAnswer.activatedLabels.slice(0, 6).map(labelize).join(" / ")
                : "The answer block captured node ids but no display labels."}
            </BindingBox>
            <BindingBox
              title="Tool trace"
              label={currentAnswer.toolReceiptRef ?? "tool receipt"}
              tone="violet"
              activeNodeIds={currentAnswer.pathToRoot}
              onSelectNode={onSelectNode}
            >
              <div className="space-y-1.5">
                {currentAnswer.trace.length > 0 ? (
                  currentAnswer.trace.slice(0, 5).map((step) => (
                    <div key={`${step.step}:${step.reason}`} className="rounded border border-violet-500/30 bg-black/20 p-1.5">
                      <div className="font-mono text-[10px] text-violet-100">{labelize(step.step)}</div>
                      <div className="mt-0.5 text-[10px] opacity-80">{step.reason}</div>
                    </div>
                  ))
                ) : (
                  <div>No structured trace steps were captured for this answer block.</div>
                )}
              </div>
            </BindingBox>
            <BindingBox title="Authority boundary" label="evidence only" tone={currentAnswer.agentExecutable ? "rose" : "slate"}>
              <div className="space-y-1">
                <div className="text-[11px] opacity-80">
                  The block is a visualization of the Ask terminal answer and its MoralGraph evidence path.
                </div>
                <div className="font-mono text-[10px]">
                  evidence_only={String(currentAnswer.evidenceOnly)} agent_executable={String(currentAnswer.agentExecutable)}
                </div>
                <div className="truncate text-[10px] opacity-75">
                  draft_ref={currentAnswer.finalAnswerDraftRef ?? "none"} receipt_ref={currentAnswer.toolReceiptRef ?? "none"}
                </div>
              </div>
            </BindingBox>
          </>
        ) : null}
        {activeLensId === "answer" && !currentAnswer ? (
          <BindingBox title="Current answer" label="empty" tone="cyan">
            No MoralGraph Ask answer has been captured yet. Run a MoralGraph prompt, then copy or open the debug export to publish the current answer block.
          </BindingBox>
        ) : null}
      </div>
    </aside>
  );
}

export function MoralGraphPanel({
  reflection,
  admission,
  locator,
  characterComparison,
}: {
  reflection: IdeologyContextReflectionV1;
  admission: HelixRecommendedActionAdmissionV1;
  locator?: MoralBadgeLocatorV1;
  characterComparison?: CharacterSituationComparisonV1;
}) {
  const scrollportRef = useRef<HTMLDivElement | null>(null);
  const pendingZoomRef = useRef<{ center: { x: number; y: number }; zoom: number } | null>(null);
  const [mapZoom, setMapZoom] = useState(1);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const fruition = useMemo(() => calculateFruitionFromReflection({ reflection, admission }), [admission, reflection]);
  const graph = useMemo(
    () => buildMoralGraphBiomeScaleViewModel({ reflection, admission, fruition, characterComparison }),
    [admission, characterComparison, fruition, reflection],
  );
  const currentAnswer = useMoralGraphCurrentAnswerStore((store) => store.currentAnswerBlock);
  const loadFruitionExpression = useFruitionCalculatorStore((store) => store.loadExpression);
  const loadFruitionLocatorSeed = useFruitionCalculatorStore((store) => store.loadLocatorSeed);
  const probabilityTerrain = locator?.probabilityTerrain;
  const terrainNodes = useMemo(
    () =>
      buildMoralTerrainNodes({
        nodes: graph.nodes,
        locator,
        rootId: reflection.graph.rootId,
      }),
    [graph.nodes, locator, reflection.graph.rootId],
  );
  const terrainChunks = useMemo(() => buildMoralTerrainChunks(terrainNodes), [terrainNodes]);
  const locatorSeedNodeIds =
    locator?.comparisonSeed.selectedNodeIds.filter((id) => graph.nodes.some((node) => node.id === id)) ?? [];
  const initialSelectedNodeId = locatorSeedNodeIds[0] ?? reflection.graph.rootId;
  const initialSelectedNodeIds = locatorSeedNodeIds.length > 0 ? locatorSeedNodeIds : [];
  const [selectedNodeId, setSelectedNodeId] = useState<string>(initialSelectedNodeId);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>(initialSelectedNodeIds);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [objectiveBindingsOpen, setObjectiveBindingsOpen] = useState(false);
  const [activeObjectiveLensId, setActiveObjectiveLensId] = useState<MoralObjectiveLensId>("wisdom");
  const selectedNode = graph.nodes.find((node) => node.id === selectedNodeId) ?? graph.nodes[0] ?? null;
  const selectedBindingNodeIds =
    selectedNodeIds.length > 0 && !selectedNodeIds.includes(reflection.graph.rootId)
      ? [...selectedNodeIds, reflection.graph.rootId]
      : selectedNodeIds;
  const selectedNodes = selectedBindingNodeIds
    .map((id) => graph.nodes.find((node) => node.id === id))
    .filter((node): node is MoralGraphNode => Boolean(node));
  const hoveredNode = hoveredNodeId ? graph.nodes.find((node) => node.id === hoveredNodeId) ?? null : null;
  const evidenceHighlighted = new Set(
    objectiveBindingsOpen
      ? [
          ...(activeObjectiveLensId === "wisdom" ? reflection.overlay?.highlightedNodeIds ?? [] : []),
          ...(activeObjectiveLensId === "character" ? characterComparison?.activatedProfileWeights.map((entry) => entry.nodeId) ?? [] : []),
          ...(activeObjectiveLensId === "character" && characterComparison ? [`character:${characterComparison.characterId}`] : []),
          ...(activeObjectiveLensId === "answer" ? currentAnswer?.activatedNodeIds ?? [] : []),
        ]
      : [],
  );
  const selectionTrace = useMemo(
    () =>
      buildMoralGraphSelectionTraceViewModel({
        nodes: graph.nodes,
        edges: graph.edges,
        selectedNodeIds,
      }),
    [graph.nodes, graph.edges, selectedNodeIds],
  );
  const highlighted = new Set([
    ...evidenceHighlighted,
    ...selectionTrace.activeNodeIds,
    ...selectionTrace.candidateNodeIds,
    ...selectionTrace.conflictNodeIds,
    ...(selectedNodeIds.length > 0 && selectedNode?.tone !== "root" ? [reflection.graph.rootId] : []),
  ]);
  const hasFocus = highlighted.size > 0 || selectedNodeIds.length > 0;
  const zoomBounds = useMemo(() => {
    const fitZoom = viewportSize.width > 0 && viewportSize.height > 0
      ? Math.min(1, viewportSize.width / graph.width, viewportSize.height / graph.height)
      : MORAL_GRAPH_MIN_ZOOM_FLOOR;
    return {
      min: clamp(fitZoom, MORAL_GRAPH_MIN_ZOOM_FLOOR, 1),
      max: MORAL_GRAPH_MAX_ZOOM,
    };
  }, [graph.height, graph.width, viewportSize.height, viewportSize.width]);
  const graphCenterForViewport = useCallback(() => {
    const element = scrollportRef.current;
    if (!element) return { x: graph.width / 2, y: graph.height / 2 };
    return {
      x: (element.scrollLeft + element.clientWidth / 2) / mapZoom,
      y: (element.scrollTop + element.clientHeight / 2) / mapZoom,
    };
  }, [graph.height, graph.width, mapZoom]);
  const centerScrollOnGraphPoint = useCallback((center: { x: number; y: number }, nextZoom: number) => {
    const element = scrollportRef.current;
    if (!element) return;
    element.scrollLeft = Math.max(0, center.x * nextZoom - element.clientWidth / 2);
    element.scrollTop = Math.max(0, center.y * nextZoom - element.clientHeight / 2);
  }, []);
  const setZoomAroundViewportCenter = useCallback(
    (targetZoom: number) => {
      const nextZoom = Number(clamp(targetZoom, zoomBounds.min, zoomBounds.max).toFixed(4));
      if (Math.abs(nextZoom - mapZoom) < 0.001) return;
      pendingZoomRef.current = { center: graphCenterForViewport(), zoom: nextZoom };
      setMapZoom(nextZoom);
    },
    [graphCenterForViewport, mapZoom, zoomBounds.max, zoomBounds.min],
  );
  const zoomOut = useCallback(() => {
    setZoomAroundViewportCenter(mapZoom / MORAL_GRAPH_ZOOM_STEP);
  }, [mapZoom, setZoomAroundViewportCenter]);
  const zoomIn = useCallback(() => {
    setZoomAroundViewportCenter(mapZoom * MORAL_GRAPH_ZOOM_STEP);
  }, [mapZoom, setZoomAroundViewportCenter]);
  useEffect(() => {
    const element = scrollportRef.current;
    if (!element) return;
    const updateSize = () => {
      setViewportSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };
    updateSize();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    setMapZoom((current) => clamp(current, zoomBounds.min, zoomBounds.max));
  }, [zoomBounds.max, zoomBounds.min]);
  useLayoutEffect(() => {
    const pending = pendingZoomRef.current;
    if (!pending || Math.abs(pending.zoom - mapZoom) > 0.001) return;
    pendingZoomRef.current = null;
    centerScrollOnGraphPoint(pending.center, mapZoom);
  }, [centerScrollOnGraphPoint, mapZoom]);
  const addNodeToSelection = (id: string) => {
    setSelectedNodeId(id);
    setSelectedNodeIds((current) => (current.includes(id) ? current : [...current, id]));
  };
  const toggleNodeSelection = (id: string) => {
    setSelectedNodeId(id);
    setSelectedNodeIds((current) => {
      if (!current.includes(id)) return [...current, id];
      if (current.length === 1) return current;
      return current.filter((selectedId) => selectedId !== id);
    });
  };
  const clearUserSelection = () => {
    setSelectedNodeIds([]);
    setSelectedNodeId(reflection.graph.rootId);
  };
  const loadToFruitionCalculator = () => {
    if (locator) {
      loadFruitionLocatorSeed(locator, { source: "moral_badge_graph" });
    } else {
      loadFruitionExpression(fruition, { source: "moral_badge_graph" });
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-helix-panel", { detail: { id: "fruition-calculator" } }));
    }
  };

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden bg-zinc-900 text-zinc-950" data-testid="moral-graph-panel">
      <div className="flex min-w-0 flex-1 flex-col bg-zinc-900">
        <div className="relative min-h-0 flex-1 overflow-hidden bg-zinc-900">
          <div
            aria-label="MoralGraph objective lenses"
            className="absolute bottom-0 left-0 top-0 z-40 flex w-9 shrink-0 flex-col items-center gap-2 border-r border-zinc-950 bg-zinc-950 px-1.5 py-2"
          >
            {MORAL_OBJECTIVE_LENSES.map((lens) => {
              const active = objectiveBindingsOpen && activeObjectiveLensId === lens.id;
              return (
                <button
                  key={lens.id}
                  type="button"
                  aria-label={lens.title}
                  title={lens.title}
                  onClick={() => {
                    setActiveObjectiveLensId(lens.id);
                    setObjectiveBindingsOpen((open) => (active ? false : true));
                  }}
                  className={`flex h-6 w-6 items-center justify-center border-2 text-[11px] font-black text-white shadow ${
                    active
                      ? "border-cyan-100 ring-2 ring-cyan-300"
                      : "border-zinc-800 opacity-80 hover:border-cyan-200"
                  } ${lens.tone}`}
                >
                  {lens.glyph}
                </button>
              );
            })}
          </div>
          {objectiveBindingsOpen ? (
            <ObjectiveBindingRail
              activeLensId={activeObjectiveLensId}
              reflection={reflection}
              admission={admission}
              fruition={fruition}
              locator={locator}
              characterComparison={characterComparison}
              currentAnswer={currentAnswer}
              selectedNode={selectedNode}
              selectedNodes={selectedNodes}
              onSelectNode={addNodeToSelection}
              onLoadFruition={loadToFruitionCalculator}
            />
          ) : null}
          <div
            ref={scrollportRef}
            data-testid="moral-graph-map-scrollport"
            data-zoom-level={mapZoom.toFixed(4)}
            className="relative h-full min-h-0 w-full overflow-scroll border border-zinc-950 bg-zinc-900"
            style={{ scrollbarGutter: "stable both-edges" }}
          >
            <div
              className="relative"
              style={{
                width: graph.width * mapZoom,
                height: graph.height * mapZoom,
              }}
            >
              <div
                className="relative origin-top-left"
                style={{
                  width: graph.width,
                  height: graph.height,
                  transform: `scale(${mapZoom})`,
                }}
              >
                <MoralGraphBiomeMap
                  graph={graph}
                  highlighted={highlighted}
                  hasFocus={hasFocus}
                  selectedNodeIds={selectedNodeIds}
                  selectionTrace={selectionTrace}
                  hoveredNode={hoveredNode}
                  zoom={mapZoom}
                  probabilityByNodeId={probabilityTerrain?.candidateProbabilityById}
                  onHoverNode={(id) => setHoveredNodeId(id)}
                  onClearSelection={clearUserSelection}
                  onToggleNode={(id, node) => {
                    toggleNodeSelection(id);
                    if (node.tone === "character") {
                      setActiveObjectiveLensId("character");
                      setObjectiveBindingsOpen(true);
                    }
                  }}
                />
                <ProbabilityTerrainOverlay
                  terrain={probabilityTerrain}
                  nodes={terrainNodes.map((node) => ({
                    id: node.id,
                    x: node.x,
                    y: node.y,
                    width: node.width ?? 48,
                    height: node.height ?? 48,
                    renderChunkId: node.renderChunkId,
                    semanticChunkId: node.semanticChunkId,
                  }))}
                  chunks={terrainChunks}
                  width={graph.width}
                  height={graph.height}
                  seed={`${reflection.reflectionId}:moral-probability-terrain`}
                    testId="moral-graph-probability-terrain-field"
                />
                {probabilityTerrain ? (
                  <div
                    data-testid="moral-graph-probability-terrain"
                    className="pointer-events-none absolute right-4 top-4 z-30 max-w-[300px] border border-cyan-400/40 bg-zinc-950/90 p-3 text-xs text-cyan-50 shadow-2xl shadow-cyan-950/30"
                  >
                    <div className="font-semibold uppercase tracking-[0.12em] text-cyan-200">Probability Terrain</div>
                    <div className="mt-1 text-zinc-300">
                      Placement certainty {(probabilityTerrain.placementCertainty * 100).toFixed(1)}% /{" "}
                      {labelize(probabilityTerrain.uncertaintyMode)}
                    </div>
                    <div className="mt-1 font-mono text-[10px] text-zinc-400">
                      H(post)={probabilityTerrain.posteriorEntropyBits.toFixed(3)} bits / gain=
                      {probabilityTerrain.informationGainBits.toFixed(3)} bits
                    </div>
                    {probabilityTerrain.dominantSemanticChunkId ? (
                      <div className="mt-1 truncate text-[10px] text-zinc-500">
                        {labelize(probabilityTerrain.dominantSemanticChunkId)}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <div
            aria-label="Moral graph zoom controls"
            className="pointer-events-auto absolute bottom-4 right-4 z-50 flex gap-2"
          >
            <button
              type="button"
              aria-label="Zoom out"
              title="Zoom out"
              onClick={zoomOut}
              disabled={mapZoom <= zoomBounds.min + 0.001}
              className="flex h-10 w-10 items-center justify-center border border-zinc-500 bg-zinc-950/90 text-2xl font-semibold leading-none text-zinc-100 shadow-lg transition hover:border-cyan-300 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-45"
            >
              -
            </button>
            <button
              type="button"
              aria-label="Zoom in"
              title="Zoom in"
              onClick={zoomIn}
              disabled={mapZoom >= zoomBounds.max - 0.001}
              className="flex h-10 w-10 items-center justify-center border border-zinc-500 bg-zinc-950/90 text-2xl font-semibold leading-none text-zinc-100 shadow-lg transition hover:border-cyan-300 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-45"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MoralGraphPanel;
