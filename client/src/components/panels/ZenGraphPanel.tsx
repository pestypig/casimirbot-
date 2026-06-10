import React, { useMemo, useState } from "react";
import type { HelixRecommendedActionAdmissionV1 } from "@shared/contracts/helix-recommended-action-admission.v1";
import type { CharacterSituationComparisonV1 } from "@shared/character-situation-comparison";
import type { IdeologyContextReflectionV1, IdeologyNodeMatchV1 } from "@shared/ideology-context-reflection";
import type { ZenBadgeLocatorV1 } from "@shared/zen-badge-locator";
import { calculateFruitionFromReflection } from "@shared/zen-graph/calculate-fruition";
import { ZEN_WISDOM_PRINCIPLES, ZEN_WISDOM_ROOT_ID } from "@shared/zen-graph/wisdom-principles";
import {
  zenRenderChunkForLocation,
  zenRenderChunkForNode,
  zenSemanticChunkForLocation,
  zenSemanticChunkForNode,
} from "@shared/zen-graph/zen-probability-chunks";
import type { FruitionProcedureExpressionV1, FruitionProcedureTermV1 } from "@shared/fruition-procedure-expression";
import { Badge } from "@/components/ui/badge";
import { useFruitionCalculatorStore } from "@/store/useFruitionCalculatorStore";
import { useZenGraphCurrentAnswerStore } from "@/store/useZenGraphCurrentAnswerStore";
import type { ZenGraphCurrentAnswerBlock } from "@/lib/zen-graph/currentAnswerBlock";
import ProbabilityTerrainOverlay from "@/components/graphs/ProbabilityTerrainOverlay";

type ZenGraphNodeTone = "root" | "principle" | "lens" | "trait" | "safeguard" | "boundary" | "action" | "objective" | "character";

type ZenGraphNode = {
  id: string;
  label: string;
  tone: ZenGraphNodeTone;
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

type ZenGraphEdge = {
  id: string;
  from: string;
  to: string;
  label: string;
  tone: "cyan" | "emerald" | "amber" | "rose" | "violet" | "slate";
  weight?: number;
};

type ZenObjectiveLensId = "wisdom" | "character" | "answer";

type ZenGraphTerrainNode = ZenGraphNode & {
  renderChunkId: string;
  semanticChunkId: string;
};

type ZenGraphTerrainChunk = {
  id: string;
  bounds: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
};

const ZEN_OBJECTIVE_LENSES: Array<{
  id: ZenObjectiveLensId;
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

function confidenceLabel(value?: number): string {
  return typeof value === "number" ? `confidence ${value.toFixed(2)}` : "diagnostic";
}

function nodeCenter(node: ZenGraphNode): { x: number; y: number } {
  return {
    x: node.x + (node.width ?? 48) / 2,
    y: node.y + (node.height ?? 48) / 2,
  };
}

function edgePath(from: ZenGraphNode, to: ZenGraphNode): string {
  const fromCenter = nodeCenter(from);
  const toCenter = nodeCenter(to);
  const x1 = fromCenter.x;
  const y1 = fromCenter.y;
  const x2 = toCenter.x;
  const y2 = toCenter.y;
  const midX = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
}

function edgeStroke(tone: ZenGraphEdge["tone"]): string {
  switch (tone) {
    case "cyan":
      return "rgb(103 232 249)";
    case "emerald":
      return "rgb(110 231 183)";
    case "amber":
      return "rgb(252 211 77)";
    case "rose":
      return "rgb(251 113 133)";
    case "violet":
      return "rgb(196 181 253)";
    default:
      return "rgb(161 161 170)";
  }
}

function nodeClasses(args: { node: ZenGraphNode; selected: boolean; highlighted: boolean; dimmed: boolean }): string {
  const classes = [
    "absolute flex h-12 w-12 items-center justify-center border-2 text-[13px] font-black uppercase shadow transition",
    "focus:outline-none focus:ring-2 focus:ring-cyan-200",
  ];
  switch (args.node.tone) {
    case "root":
      classes.push("border-zinc-100 bg-gradient-to-br from-zinc-100 via-zinc-400 to-zinc-800 text-zinc-950");
      break;
    case "principle":
      classes.push("border-sky-200 bg-gradient-to-br from-sky-100 via-zinc-300 to-sky-950 text-zinc-950");
      break;
    case "lens":
      classes.push("border-cyan-200 bg-gradient-to-br from-cyan-100 via-zinc-400 to-cyan-900 text-zinc-950");
      break;
    case "trait":
      classes.push("border-emerald-200 bg-gradient-to-br from-emerald-100 via-zinc-400 to-emerald-900 text-zinc-950");
      break;
    case "safeguard":
      classes.push("border-amber-200 bg-gradient-to-br from-amber-100 via-zinc-400 to-amber-950 text-zinc-950");
      break;
    case "boundary":
      classes.push("border-rose-200 bg-gradient-to-br from-rose-100 via-zinc-500 to-rose-950 text-zinc-950");
      break;
    case "action":
      classes.push("border-violet-200 bg-gradient-to-br from-violet-100 via-zinc-400 to-violet-950 text-zinc-950");
      break;
    case "objective":
      classes.push("border-fuchsia-200 bg-gradient-to-br from-fuchsia-100 via-zinc-400 to-fuchsia-950 text-zinc-950");
      break;
    case "character":
      classes.push("border-amber-200 bg-gradient-to-br from-amber-100 via-zinc-400 to-red-950 text-zinc-950");
      break;
  }
  if (args.selected) classes.push("ring-4 ring-cyan-200/80 shadow-cyan-200/50");
  else if (args.highlighted) classes.push("ring-2 ring-cyan-400/70");
  if (args.dimmed) classes.push("opacity-30 grayscale");
  return classes.join(" ");
}

function nodeGlyph(node: ZenGraphNode): string {
  if (node.tone === "root") return "R";
  if (node.tone === "principle") return "P";
  if (node.tone === "lens") return "L";
  if (node.tone === "trait") return "T";
  if (node.tone === "safeguard") return "G";
  if (node.tone === "boundary") return "!";
  if (node.tone === "objective") return "B";
  if (node.tone === "character") return "C";
  return "A";
}

function buildLocatorChunkMap(locator: ZenBadgeLocatorV1 | undefined, rootId: string) {
  const chunksByNodeId = new Map<string, { renderChunkId: string; semanticChunkId: string }>();
  if (!locator) return chunksByNodeId;
  const locations = [
    ...locator.locatedBadges.exact,
    ...locator.locatedBadges.likely,
    ...locator.locatedBadges.inferred,
  ];
  for (const location of locations) {
    chunksByNodeId.set(location.nodeId, {
      renderChunkId: zenRenderChunkForLocation({ rootId, location }),
      semanticChunkId: zenSemanticChunkForLocation(location),
    });
  }
  return chunksByNodeId;
}

function buildZenTerrainNodes(args: {
  nodes: ZenGraphNode[];
  locator?: ZenBadgeLocatorV1;
  rootId: string;
}): ZenGraphTerrainNode[] {
  const locatorChunks = buildLocatorChunkMap(args.locator, args.rootId);
  return args.nodes.map((node) => {
    const located = locatorChunks.get(node.id);
    return {
      ...node,
      renderChunkId:
        located?.renderChunkId ??
        zenRenderChunkForNode({
          rootId: args.rootId,
          node,
        }),
      semanticChunkId: located?.semanticChunkId ?? zenSemanticChunkForNode(node),
    };
  });
}

function buildZenTerrainChunks(nodes: ZenGraphTerrainNode[]): ZenGraphTerrainChunk[] {
  const groups = new Map<string, ZenGraphTerrainNode[]>();
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

function matchLabel(match: IdeologyNodeMatchV1): string {
  return `${match.label} / ${confidenceLabel(match.score)}`;
}

function proceduralToken(value: string): string {
  return value.replace(/[^a-z0-9_-]+/gi, "_");
}

function proceduralSubjectForNode(node: Pick<ZenGraphNode, "id" | "tone">): string {
  if (node.tone === "root") return `root.${proceduralToken(node.id)}`;
  if (node.tone === "principle") return `principle.${proceduralToken(node.id)}`;
  if (node.tone === "objective") return `objective.${proceduralToken(node.id)}`;
  if (node.tone === "character") return `character.${proceduralToken(node.id)}`;
  if (node.tone === "safeguard") return `gate.${proceduralToken(node.id)}`;
  if (node.tone === "boundary") return `missing.${proceduralToken(node.id.replace(/^missing:/, ""))}`;
  if (node.tone === "action") return `action.${proceduralToken(node.id.replace(/^action:/, ""))}`;
  return `lens.${proceduralToken(node.id)}`;
}

function rootProcedureExpression(rootId: string): string {
  if (rootId !== ZEN_WISDOM_ROOT_ID) return `root.${proceduralToken(rootId)} supports result.procedural_posture`;
  return `objective.${ZEN_WISDOM_ROOT_ID} receives preset.wisdom-foundation`;
}

function principleProcedureExpression(principle: (typeof ZEN_WISDOM_PRINCIPLES)[number]): string {
  return `principle.${proceduralToken(principle.id)} ${labelize(principle.procedureOperator)} result.procedural_posture`;
}

function fallbackProcedureExpression(node: ZenGraphNode): string {
  const operator = node.procedureOperator ?? (node.tone === "boundary" || node.tone === "safeguard" ? "requires" : "supports");
  return `${proceduralSubjectForNode(node)} ${labelize(operator)} result.procedural_posture`;
}

function termProcedureExpression(node: ZenGraphNode, term: FruitionProcedureTermV1): string {
  return `${proceduralSubjectForNode(node)} ${labelize(term.procedureOperator ?? term.polarity)} result.procedural_posture`;
}

function selectedCombinationOutcome(nodes: ZenGraphNode[]): { posture: string; label: string } {
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

function selectedCombinationExpression(nodes: ZenGraphNode[]): string {
  if (nodes.length === 0) return "No selected badge combination.";
  const outcome = selectedCombinationOutcome(nodes);
  return `${nodes.map((node) => node.proceduralExpression ?? fallbackProcedureExpression(node)).join(" + ")} => ${outcome.posture}`;
}

function addNode(nodes: Map<string, ZenGraphNode>, node: ZenGraphNode): void {
  if (!nodes.has(node.id)) nodes.set(node.id, node);
}

function addPathNodes(params: {
  nodes: Map<string, ZenGraphNode>;
  edges: ZenGraphEdge[];
  path: string[];
  labelsById: Map<string, string>;
  laneY: number;
  tone: ZenGraphNodeTone;
  edgeTone: ZenGraphEdge["tone"];
  summary: string;
  confidence?: number;
  tags?: string[];
}): void {
  const pathRootFirst = [...params.path].reverse();
  pathRootFirst.forEach((nodeId, index) => {
    const isRoot = nodeId === ZEN_WISDOM_ROOT_ID;
    addNode(params.nodes, {
      id: nodeId,
      label: params.labelsById.get(nodeId) ?? labelize(nodeId),
      tone: isRoot ? "objective" : params.tone,
      glyph: "",
      x: isRoot ? 920 : 210 + index * 150,
      y: params.laneY,
      confidence: isRoot ? undefined : params.confidence,
      tags: isRoot ? ["objective_binding", "preset"] : params.tags,
      summary: isRoot ? "Objective binding assembled from primitive wisdom badges." : params.summary,
      proceduralExpression: isRoot
        ? rootProcedureExpression(nodeId)
        : fallbackProcedureExpression({
            id: nodeId,
            label: params.labelsById.get(nodeId) ?? labelize(nodeId),
            tone: params.tone,
            glyph: "",
            x: 0,
            y: 0,
            summary: params.summary,
          }),
    });
    if (index > 0) {
      const from = nodeId;
      const to = pathRootFirst[index - 1];
      params.edges.push({
        id: `path:${from}:${to}`,
        from,
        to,
        label: "path to binding",
        tone: params.edgeTone,
      });
    }
  });
}

function findProcedureTermForNode(node: ZenGraphNode, fruition: FruitionProcedureExpressionV1): FruitionProcedureTermV1 | undefined {
  const missingCheck = node.id.startsWith("missing:") ? node.id.slice("missing:".length) : null;
  const actionId = node.id.startsWith("action:") ? node.id.slice("action:".length) : null;
  return fruition.terms.find((term) => {
    if (term.sourceNodeIds?.includes(node.id)) return true;
    if (missingCheck && term.id === `fruition.missing.${missingCheck.replace(/[^a-z0-9_-]+/gi, "_")}`) return true;
    if (actionId && term.id === `fruition.action.${actionId.replace(/[^a-z0-9_-]+/gi, "_")}`) return true;
    return false;
  });
}

function decorateProcedureNode(node: ZenGraphNode, fruition: FruitionProcedureExpressionV1): ZenGraphNode {
  const term = findProcedureTermForNode(node, fruition);
  if (!term) {
    return {
      ...node,
      proceduralExpression: node.proceduralExpression ?? fallbackProcedureExpression(node),
    };
  }
  return {
    ...node,
    proceduralExpression: termProcedureExpression(node, term),
    proceduralRole: term.proceduralRole,
    procedureOperator: term.procedureOperator,
    actionEffect: term.actionEffect,
    evidenceNeeds: term.evidenceNeeds,
    refusesAuthority: term.refusesAuthority,
  };
}

function buildGraph(
  reflection: IdeologyContextReflectionV1,
  admission: HelixRecommendedActionAdmissionV1,
  fruition: FruitionProcedureExpressionV1,
  characterComparison?: CharacterSituationComparisonV1,
) {
  const nodes = new Map<string, ZenGraphNode>();
  const edges: ZenGraphEdge[] = [];
  const labelsById = new Map<string, string>([
    [reflection.graph.rootId, labelize(reflection.graph.rootId)],
    ...reflection.matches.exact.map((match) => [match.nodeId, match.label] as const),
    ...reflection.matches.likely.map((match) => [match.nodeId, match.label] as const),
    ...reflection.matches.inferred_lenses.map((match) => [match.nodeId, match.label] as const),
    ...reflection.activated_traits.map((trait) => [trait.nodeId, trait.label] as const),
    ...(reflection.action_gate_warnings ?? []).map((warning) => [warning.gateId, warning.label] as const),
  ]);

  addNode(nodes, {
    id: reflection.graph.rootId,
    label: reflection.graph.rootId === ZEN_WISDOM_ROOT_ID ? "Wisdom First Principles" : labelize(reflection.graph.rootId),
    tone: reflection.graph.rootId === ZEN_WISDOM_ROOT_ID ? "objective" : "root",
    glyph: reflection.graph.rootId === ZEN_WISDOM_ROOT_ID ? "B" : "",
    x: reflection.graph.rootId === ZEN_WISDOM_ROOT_ID ? 900 : 90,
    y: 210,
    tags: reflection.graph.rootId === ZEN_WISDOM_ROOT_ID ? ["objective_binding", "preset"] : ["root"],
    summary: reflection.graph.rootId === ZEN_WISDOM_ROOT_ID ? "Objective binding assembled from primitive wisdom badges." : "Root principle",
    proceduralExpression: rootProcedureExpression(reflection.graph.rootId),
  });

  if (reflection.graph.rootId === ZEN_WISDOM_ROOT_ID) {
    ZEN_WISDOM_PRINCIPLES.forEach((principle, index) => {
      const x = 120 + (index % 4) * 142;
      const y = 84 + Math.floor(index / 4) * 92;
      addNode(nodes, {
        id: principle.id,
        label: principle.label,
        tone: "principle",
        glyph: principle.glyph,
        x,
        y,
        tags: principle.tags,
        summary: principle.summary,
        proceduralExpression: principleProcedureExpression(principle),
        proceduralRole: principle.proceduralRole,
        procedureOperator: principle.procedureOperator,
        actionEffect: principle.actionEffect,
        evidenceNeeds: principle.evidenceNeeds,
        refusesAuthority: principle.refusesAuthority,
      });
      edges.push({
        id: `wisdom:${reflection.graph.rootId}:${principle.id}`,
        from: principle.id,
        to: reflection.graph.rootId,
        label: "assembles binding",
        tone: "emerald",
      });
    });
  }

  let lane = 0;
  const addMatch = (match: IdeologyNodeMatchV1, tone: ZenGraphNodeTone, edgeTone: ZenGraphEdge["tone"], summary: string) => {
    if (match.pathToRoot?.length) {
      addPathNodes({
        nodes,
        edges,
        path: match.pathToRoot,
        labelsById,
        laneY: 130 + lane * 120,
        tone,
        edgeTone,
        summary,
        confidence: match.score,
        tags: match.tags,
      });
      lane += 1;
      return;
    }
    addNode(nodes, {
      id: match.nodeId,
      label: match.label,
      tone,
      glyph: "",
      x: 320,
      y: 130 + lane * 120,
      confidence: match.score,
      tags: match.tags,
      summary,
      proceduralExpression: `lens.${proceduralToken(match.nodeId)} supports result.procedural_posture`,
    });
    edges.push({ id: `root:${match.nodeId}`, from: reflection.graph.rootId, to: match.nodeId, label: "activates", tone: edgeTone });
    lane += 1;
  };

  reflection.matches.exact.forEach((match) => addMatch(match, "lens", "cyan", "Exact ZenGraph lens match"));
  reflection.matches.likely.forEach((match) => addMatch(match, "lens", "slate", "Likely ZenGraph lens match"));
  reflection.matches.inferred_lenses.forEach((match) => addMatch(match, "trait", "emerald", "Inferred outer-edge lens"));
  reflection.activated_traits.forEach((trait) => {
    if (!trait.pathToRoot.length) return;
    addPathNodes({
      nodes,
      edges,
      path: trait.pathToRoot,
      labelsById,
      laneY: 130 + lane * 120,
      tone: "trait",
      edgeTone: "emerald",
      summary: "Activated trait path",
      confidence: trait.confidence,
      tags: trait.tags,
    });
    lane += 1;
  });

  (reflection.action_gate_warnings ?? []).forEach((warning, index) => {
    const y = 110 + index * 105;
    addNode(nodes, {
      id: warning.gateId,
      label: warning.label,
      tone: "safeguard",
      glyph: "",
      x: 620,
      y,
      tags: warning.requiredCheck ? [warning.requiredCheck] : ["action_gate"],
      summary: warning.warning,
      proceduralExpression: `gate.${proceduralToken(warning.gateId)} requires result.procedural_posture`,
    });
    for (const target of [...reflection.matches.exact, ...reflection.matches.likely, ...reflection.matches.inferred_lenses]) {
      if (target.nodeId !== warning.gateId && nodes.has(target.nodeId)) {
        edges.push({
          id: `safeguard:${target.nodeId}:${warning.gateId}`,
          from: target.nodeId,
          to: warning.gateId,
          label: "safeguard",
          tone: "amber",
        });
      }
    }
  });

  (reflection.claim_boundaries.missing_evidence ?? []).forEach((missing, index) => {
    const id = `missing:${missing}`;
    addNode(nodes, {
      id,
      label: labelize(missing),
      tone: "boundary",
      glyph: "",
      x: 620,
      y: 330 + index * 90,
      tags: ["missing_check"],
      summary: "Missing check keeps the reflection diagnostic.",
      proceduralExpression: `missing.${proceduralToken(missing)} asks for result.procedural_posture`,
    });
    edges.push({ id: `boundary:${id}`, from: reflection.graph.rootId, to: id, label: "claim boundary", tone: "rose" });
  });

  admission.actions.slice(0, 4).forEach((action, index) => {
    const id = `action:${action.actionId}`;
    addNode(nodes, {
      id,
      label: action.label,
      tone: action.admission === "blocked" ? "boundary" : "action",
      glyph: "",
      x: 850,
      y: 135 + index * 95,
      tags: action.reasonCodes,
      summary: `${labelize(action.admission)} / ${labelize(action.risk)} / ${labelize(action.display_policy ?? "actionable")}`,
      proceduralExpression: `action.${proceduralToken(action.actionId)} ${action.admission === "blocked" ? "blocks" : "routes to"} result.procedural_posture`,
    });
    edges.push({
      id: `action:${action.actionId}`,
      from: reflection.graph.rootId,
      to: id,
      label: "recommended next step",
      tone: action.admission === "blocked" ? "rose" : "violet",
    });
  });

  if (reflection.graph.rootId === ZEN_WISDOM_ROOT_ID && nodes.has("mission-ethos")) {
    ZEN_WISDOM_PRINCIPLES.forEach((principle) => {
      edges.push({
        id: `wisdom-objective:${principle.id}:mission-ethos`,
        from: principle.id,
        to: "mission-ethos",
        label: "assembles objective",
        tone: "emerald",
      });
    });
  }

  if (characterComparison) {
    const characterNodeId = `character:${characterComparison.characterId}`;
    const activatedWeights = characterComparison.activatedProfileWeights.slice(0, 7);
    addNode(nodes, {
      id: characterNodeId,
      label:
        characterComparison.characterId === "logh.reinhard_von_lohengramm"
          ? "Reinhard von Lohengramm"
          : labelize(characterComparison.characterId),
      tone: "character",
      glyph: "C",
      x: 700,
      y: Math.max(430, 120 + Math.max(3, lane) * 92),
      tags: ["character_preset", "diagnostic_only", characterComparison.predictedPosture],
      summary: "Character preset badge: opens a bounded objective binding modeled from a known figure.",
      proceduralExpression: `character.${proceduralToken(characterComparison.characterId)} weights activated badges => ${labelize(
        characterComparison.predictedPosture,
      )}`,
      proceduralRole: "objective_view",
      procedureOperator: "routes_to",
      actionEffect: characterComparison.behavioralHypothesis.likelyChoice,
      evidenceNeeds: characterComparison.behavioralHypothesis.missingEvidence,
      refusesAuthority: ["moral_verdict", "canon_certainty_without_source", "execution_authority"],
      characterWeights: activatedWeights,
      characterHypothesis: characterComparison.behavioralHypothesis,
    });
    for (const activation of activatedWeights) {
      if (!nodes.has(activation.nodeId)) continue;
      edges.push({
        id: `character:${activation.nodeId}:${characterNodeId}`,
        from: activation.nodeId,
        to: characterNodeId,
        label: labelize(activation.relation),
        tone:
          activation.relation === "tensions"
            ? "rose"
            : activation.relation === "counterweighted"
              ? "amber"
              : activation.relation === "missing"
                ? "violet"
                : "emerald",
        weight: Math.max(0.5, activation.graphConfidence * activation.characterWeight),
      });
    }
    edges.push({
      id: `character:${characterNodeId}:fruition`,
      from: characterNodeId,
      to: reflection.graph.rootId,
      label: "character weighted posture",
      tone: "amber",
      weight: 0.85,
    });
  }

  return {
    nodes: [...nodes.values()].map((node) => decorateProcedureNode({ ...node, glyph: node.glyph || nodeGlyph(node) }, fruition)),
    edges: edges.filter((edge, index, all) => all.findIndex((candidate) => candidate.id === edge.id) === index),
    width: 1200,
    height: Math.max(760, 260 + Math.max(3, lane) * 120),
  };
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
  activeLensId: ZenObjectiveLensId;
  reflection: IdeologyContextReflectionV1;
  admission: HelixRecommendedActionAdmissionV1;
  fruition: FruitionProcedureExpressionV1;
  locator?: ZenBadgeLocatorV1;
  characterComparison?: CharacterSituationComparisonV1;
  currentAnswer?: ZenGraphCurrentAnswerBlock | null;
  selectedNode: ZenGraphNode | null;
  selectedNodes: ZenGraphNode[];
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
  const activeLens = ZEN_OBJECTIVE_LENSES.find((lens) => lens.id === activeLensId) ?? ZEN_OBJECTIVE_LENSES[0];
  return (
    <aside
      data-testid="zen-graph-objective-binding-overlay"
      className="pointer-events-auto absolute bottom-3 left-9 top-3 z-30 flex w-64 shrink-0 flex-col border border-zinc-800 bg-zinc-950/95 text-zinc-100 shadow-2xl"
    >
      <div className="border-b border-zinc-800 p-2.5">
        <div className="text-xs font-semibold uppercase tracking-wide text-cyan-200">Objective Bindings</div>
        <h2 className="mt-0.5 text-base font-semibold leading-tight">ZenGraph {activeLens.label}</h2>
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
                  The block is a visualization of the Ask terminal answer and its ZenGraph evidence path.
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
            No ZenGraph Ask answer has been captured yet. Run a ZenGraph prompt, then copy or open the debug export to publish the current answer block.
          </BindingBox>
        ) : null}
      </div>
    </aside>
  );
}

export function ZenGraphPanel({
  reflection,
  admission,
  locator,
  characterComparison,
}: {
  reflection: IdeologyContextReflectionV1;
  admission: HelixRecommendedActionAdmissionV1;
  locator?: ZenBadgeLocatorV1;
  characterComparison?: CharacterSituationComparisonV1;
}) {
  const fruition = useMemo(() => calculateFruitionFromReflection({ reflection, admission }), [admission, reflection]);
  const graph = useMemo(
    () => buildGraph(reflection, admission, fruition, characterComparison),
    [admission, characterComparison, fruition, reflection],
  );
  const currentAnswer = useZenGraphCurrentAnswerStore((store) => store.currentAnswerBlock);
  const loadFruitionExpression = useFruitionCalculatorStore((store) => store.loadExpression);
  const loadFruitionLocatorSeed = useFruitionCalculatorStore((store) => store.loadLocatorSeed);
  const probabilityTerrain = locator?.probabilityTerrain;
  const terrainNodes = useMemo(
    () =>
      buildZenTerrainNodes({
        nodes: graph.nodes,
        locator,
        rootId: reflection.graph.rootId,
      }),
    [graph.nodes, locator, reflection.graph.rootId],
  );
  const terrainChunks = useMemo(() => buildZenTerrainChunks(terrainNodes), [terrainNodes]);
  const locatorSeedNodeIds =
    locator?.comparisonSeed.selectedNodeIds.filter((id) => graph.nodes.some((node) => node.id === id)) ?? [];
  const initialSelectedNodeId = locatorSeedNodeIds[0] ?? reflection.overlay?.highlightedNodeIds[0] ?? reflection.graph.rootId;
  const initialSelectedNodeIds = locatorSeedNodeIds.length > 0 ? locatorSeedNodeIds : [initialSelectedNodeId];
  const [selectedNodeId, setSelectedNodeId] = useState<string>(initialSelectedNodeId);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>(initialSelectedNodeIds);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [objectiveBindingsOpen, setObjectiveBindingsOpen] = useState(false);
  const [activeObjectiveLensId, setActiveObjectiveLensId] = useState<ZenObjectiveLensId>("wisdom");
  const selectedNode = graph.nodes.find((node) => node.id === selectedNodeId) ?? graph.nodes[0] ?? null;
  const selectedNodes = selectedNodeIds
    .map((id) => graph.nodes.find((node) => node.id === id))
    .filter((node): node is ZenGraphNode => Boolean(node));
  const hoveredNode = hoveredNodeId ? graph.nodes.find((node) => node.id === hoveredNodeId) ?? null : null;
  const highlighted = new Set([
    ...selectedNodeIds,
    ...(reflection.overlay?.highlightedNodeIds ?? []),
    ...(characterComparison?.activatedProfileWeights.map((entry) => entry.nodeId) ?? []),
    ...(characterComparison ? [`character:${characterComparison.characterId}`] : []),
    ...(probabilityTerrain?.dominantCandidateId ? [probabilityTerrain.dominantCandidateId] : []),
    ...(objectiveBindingsOpen && activeObjectiveLensId === "answer" ? currentAnswer?.activatedNodeIds ?? [] : []),
    ...(selectedNode?.tone === "root" ? [] : [reflection.graph.rootId]),
  ]);
  const hasFocus = highlighted.size > 0;
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
  const loadToFruitionCalculator = () => {
    if (locator) {
      loadFruitionLocatorSeed(locator, { source: "zen_badge_graph" });
    } else {
      loadFruitionExpression(fruition, { source: "zen_badge_graph" });
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-helix-panel", { detail: { id: "fruition-calculator" } }));
    }
  };

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden bg-zinc-900 text-zinc-950" data-testid="zen-graph-panel">
      <div className="flex min-w-0 flex-1 flex-col bg-zinc-900">
        <div className="relative min-h-0 flex-1 overflow-hidden bg-zinc-900">
          <div
            aria-label="ZenGraph objective lenses"
            className="absolute bottom-0 left-0 top-0 z-40 flex w-9 shrink-0 flex-col items-center gap-2 border-r border-zinc-950 bg-zinc-950 px-1.5 py-2"
          >
            {ZEN_OBJECTIVE_LENSES.map((lens) => {
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
            data-testid="zen-graph-map-scrollport"
            className="relative h-full min-h-0 w-full overflow-scroll border border-zinc-950 bg-zinc-900"
            style={{ scrollbarGutter: "stable both-edges" }}
          >
            <div
              className="relative"
              style={{
                width: graph.width,
                height: graph.height,
                backgroundImage: [
                  "linear-gradient(rgba(10,10,10,0.22) 1px, transparent 1px)",
                  "linear-gradient(90deg, rgba(10,10,10,0.22) 1px, transparent 1px)",
                  "radial-gradient(circle at 16% 20%, rgba(22,78,99,0.32) 0 8px, transparent 9px)",
                  "radial-gradient(circle at 76% 26%, rgba(113,63,18,0.28) 0 9px, transparent 10px)",
                  "linear-gradient(to bottom, #312e20 0 70px, #3f3f46 70px 78%, #171717 78% 100%)",
                ].join(", "),
                backgroundSize: "32px 32px, 32px 32px, 220px 180px, 280px 220px, auto",
              }}
            >
              <div className="pointer-events-none absolute inset-x-0 top-[70px] h-10 bg-[linear-gradient(135deg,transparent_0_16px,rgba(39,39,42,0.9)_17px_32px,transparent_33px_48px)] bg-[length:96px_40px]" />
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
                seed={`${reflection.reflectionId}:zen-probability-terrain`}
                testId="zen-graph-probability-terrain-field"
              />
              {probabilityTerrain ? (
                <div
                  data-testid="zen-graph-probability-terrain"
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
              <svg className="pointer-events-none absolute inset-0" width={graph.width} height={graph.height}>
                <defs>
                  <marker id="zen-graph-arrow" markerHeight="7" markerWidth="7" orient="auto" refX="6" refY="3.5">
                    <path d="M 0 0 L 7 3.5 L 0 7 z" fill="rgb(161 161 170)" />
                  </marker>
                </defs>
                {graph.edges.map((edge) => {
                  const from = graph.nodes.find((node) => node.id === edge.from);
                  const to = graph.nodes.find((node) => node.id === edge.to);
                  if (!from || !to) return null;
                  const highlightedEdge = highlighted.has(edge.from) && highlighted.has(edge.to);
                  return (
                    <g key={edge.id}>
                      <path
                        d={edgePath(from, to)}
                        stroke={edgeStroke(edge.tone)}
                        strokeWidth={highlightedEdge ? 4 + (edge.weight ?? 0) * 2 : 2 + (edge.weight ?? 0)}
                        strokeOpacity={hasFocus && !highlightedEdge ? 0.26 : 0.78}
                        strokeDasharray={edge.label === "claim boundary" ? "6 7" : undefined}
                        fill="none"
                        strokeLinecap="square"
                        markerEnd="url(#zen-graph-arrow)"
                      />
                    </g>
                  );
                })}
              </svg>
              {graph.nodes.map((node) => {
                const selected = selectedNodeIds.includes(node.id);
                const highlightedNode = highlighted.has(node.id);
                const dimmed = hasFocus && !highlightedNode;
                const placementProbability = probabilityTerrain?.candidateProbabilityById[node.id] ?? 0;
                return (
                  <button
                    key={node.id}
                    type="button"
                    className={nodeClasses({ node, selected, highlighted: highlightedNode, dimmed })}
                    data-testid="zen-graph-badge-node"
                    style={{
                      left: node.x,
                      top: node.y,
                      boxShadow:
                        placementProbability > 0
                          ? `0 0 0 ${Math.max(2, Math.round(placementProbability * 9))}px rgba(34,211,238,0.28)`
                          : undefined,
                    }}
                    aria-label={node.label}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId((current) => (current === node.id ? null : current))}
                    onFocus={() => setHoveredNodeId(node.id)}
                    onBlur={() => setHoveredNodeId((current) => (current === node.id ? null : current))}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                      event.stopPropagation();
                      toggleNodeSelection(node.id);
                      if (node.tone === "character") {
                        setActiveObjectiveLensId("character");
                        setObjectiveBindingsOpen(true);
                      }
                    }}
                  >
                    <span className="flex h-8 w-8 items-center justify-center border border-zinc-700 bg-zinc-300 shadow-inner">
                      {node.glyph}
                    </span>
                    {node.confidence || node.tone === "character" ? (
                      <span className="absolute -right-1 -top-1 h-3 w-3 border border-cyan-100 bg-cyan-400" />
                    ) : null}
                    {node.tone === "boundary" ? (
                      <span className="pointer-events-none absolute -inset-1.5 border-2 border-rose-300/80" />
                    ) : null}
                  </button>
                );
              })}
              {hoveredNode ? (
                <div
                  data-testid="zen-graph-hover-card"
                  className="pointer-events-none absolute z-50 max-w-[260px] rounded border border-cyan-700/70 bg-zinc-950/95 p-2 text-xs text-zinc-200 shadow-2xl shadow-cyan-950/40"
                  style={{ left: hoveredNode.x + 62, top: Math.max(12, hoveredNode.y - 8) }}
                >
                  <div className="font-semibold text-zinc-50">{hoveredNode.label}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-zinc-500">{hoveredNode.id}</div>
                  <div className="mt-1 font-mono text-[11px] leading-snug text-cyan-100">
                    {hoveredNode.proceduralExpression ?? fallbackProcedureExpression(hoveredNode)}
                  </div>
                  {hoveredNode.proceduralRole ? (
                    <div className="mt-1 text-cyan-100">
                      {labelize(hoveredNode.proceduralRole)}
                      {hoveredNode.procedureOperator ? ` -> ${labelize(hoveredNode.procedureOperator)}` : ""}
                    </div>
                  ) : null}
                  {hoveredNode.actionEffect ? (
                    <div className="mt-1 text-zinc-300">{hoveredNode.actionEffect}</div>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge variant="outline" className="border-zinc-700 text-[10px] text-zinc-300">
                      {hoveredNode.tone}
                    </Badge>
                    {hoveredNode.proceduralRole ? (
                      <Badge variant="outline" className="border-cyan-700 text-[10px] text-cyan-200">
                        {labelize(hoveredNode.proceduralRole)}
                      </Badge>
                    ) : null}
                    {(hoveredNode.tags ?? []).slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="border-zinc-700 text-[10px] text-zinc-300">
                        {labelize(tag)}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ZenGraphPanel;
