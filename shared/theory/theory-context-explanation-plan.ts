import {
  buildTheoryContextExplanationPlanV1,
  type TheoryContextExplanationNodeRoleV1,
  type TheoryContextExplanationNodeV1,
  type TheoryContextExplanationPlanV1,
  type TheoryContextExplanationRecommendedActionV1,
  type TheoryContextExplanationStepRoleV1,
  type TheoryContextExplanationStepV1,
} from "../contracts/theory-context-explanation-plan.v1";
import type { TheoryContextReflectionV1 } from "../contracts/theory-context-reflection.v1";
import type { TheoryBadgeEdgeV1, TheoryBadgeGraphV1, TheoryBadgeV1 } from "../contracts/theory-badge-graph.v1";
import { traceTheoryBadgeConnections } from "./theory-badge-overlap-locator";

export type BuildTheoryContextExplanationPlanInput = {
  graph: TheoryBadgeGraphV1;
  reflection: TheoryContextReflectionV1;
  generatedAt?: string;
  planId?: string;
};

const RUNTIME_OPERATOR_KINDS = new Set([
  "tensor_component",
  "field_sample",
  "region_aggregate",
  "worldline_integral",
  "gate_status",
  "noncomputable_reference",
]);

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\\_/g, "_")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function badgeMap(graph: TheoryBadgeGraphV1): Map<string, TheoryBadgeV1> {
  return new Map(graph.badges.map((badge) => [badge.id, badge]));
}

function edgeMap(graph: TheoryBadgeGraphV1): Map<string, TheoryBadgeEdgeV1> {
  return new Map(graph.edges.map((edge) => [edge.id, edge]));
}

function claimBoundaryNotesForBadge(badge: TheoryBadgeV1): string[] {
  const notes: string[] = [];
  if (badge.claimBoundary.diagnosticOnly) notes.push(`${badge.id}: diagnostic-only context`);
  if (!badge.claimBoundary.validationClaimAllowed) notes.push(`${badge.id}: validation claim not allowed`);
  if (!badge.claimBoundary.physicalMechanismClaimAllowed) {
    notes.push(`${badge.id}: physical mechanism claim not allowed`);
  }
  if (!badge.claimBoundary.promotionAllowed) notes.push(`${badge.id}: promotion not allowed`);
  return notes;
}

function primaryEquation(badge: TheoryBadgeV1): { displayLatex: string | null; expression: string | null } {
  const payload = badge.calculatorPayloads[0];
  if (payload) {
    return {
      displayLatex: payload.displayLatex,
      expression: payload.expression,
    };
  }
  const equation = badge.equations[0];
  return {
    displayLatex: equation?.displayLatex ?? null,
    expression: equation?.computableExpression ?? null,
  };
}

function isRuntimeOrEvidenceBadge(badge: TheoryBadgeV1): boolean {
  return (
    /\b(runtime|receipt|artifact|evidence|gate)\b/i.test(`${badge.id} ${badge.title}`) ||
    badge.equations.some((equation) => RUNTIME_OPERATOR_KINDS.has(equation.operatorKind ?? ""))
  );
}

function isClaimBoundaryBadge(badge: TheoryBadgeV1): boolean {
  return (
    badge.level === "claim_boundary" ||
    /\bclaim[_\s-]?boundary|diagnostic[_\s-]?only|boundary\b/i.test(`${badge.id} ${badge.title}`)
  );
}

function isFirstPrincipleRoot(badge: TheoryBadgeV1): boolean {
  const keys = unique([badge.level, ...badge.subjects, ...badge.tags, ...badge.equationFamilies]).map(normalizeKey);
  return (
    keys.some((key) =>
      [
        "foundation",
        "foundations",
        "first_principle",
        "first_principles",
        "constant",
        "constants",
        "quantum",
        "relativity",
        "radiation",
      ].includes(key),
    ) ||
    /\b(energy_frequency|einstein_field_equation|stress_energy_tensor|conservation)\b/i.test(badge.id)
  );
}

function isDiagnosticBadge(badge: TheoryBadgeV1): boolean {
  const text = [
    badge.id,
    badge.title,
    ...badge.subjects,
    ...badge.tags,
    ...badge.equationFamilies,
  ].join(" ");
  return /\b(diagnostic|qei|source|closure|residual|stress[_\s-]?energy|nhm2|margin|gate)\b/i.test(text);
}

function roleForBadge(badge: TheoryBadgeV1): TheoryContextExplanationNodeRoleV1 {
  if (isClaimBoundaryBadge(badge)) return "claim_boundary";
  if (isFirstPrincipleRoot(badge)) return "first_principle_root";
  if (isRuntimeOrEvidenceBadge(badge)) return "runtime_or_evidence";
  if (isDiagnosticBadge(badge)) return "diagnostic_branch";
  return "model_branch";
}

function toNode(badge: TheoryBadgeV1, role = roleForBadge(badge)): TheoryContextExplanationNodeV1 {
  const equation = primaryEquation(badge);
  return {
    badgeId: badge.id,
    title: badge.title,
    level: badge.level,
    subjects: badge.subjects,
    role,
    displayLatex: equation.displayLatex,
    expression: equation.expression,
    claimBoundaryNotes: claimBoundaryNotesForBadge(badge),
    sourceRefs: badge.sourceRefs.map((ref) => ({
      kind: ref.kind,
      path: ref.path ?? null,
      id: ref.id ?? null,
      note: ref.note ?? null,
    })),
  };
}

function recommendedActions(args: {
  selectedBadgeIds: string[];
  scalarCutBadgeIds: string[];
  runtimeTraceBadgeIds: string[];
}): TheoryContextExplanationRecommendedActionV1[] {
  const selectedBadgeIds = unique(args.selectedBadgeIds);
  if (selectedBadgeIds.length === 0) return [];
  const actions: TheoryContextExplanationRecommendedActionV1[] = [
    {
      actionId: "theory-badge-graph.build_compound_theory_run",
      label: "Build compound theory run",
      panelId: "theory-badge-graph",
      args: {
        badge_ids: selectedBadgeIds,
        mode: "dependency_path",
        include_scalar: true,
        include_runtime: true,
        include_evidence: true,
        include_boundaries: true,
      },
      mutatesCalculator: false,
      solves: false,
    },
    {
      actionId: "theory-badge-graph.load_compound_theory_run",
      label: "Load compound theory run",
      panelId: "theory-badge-graph",
      args: {
        badge_ids: selectedBadgeIds,
        mode: "dependency_path",
      },
      mutatesCalculator: true,
      solves: false,
    },
  ];

  if (args.scalarCutBadgeIds.length > 0) {
    actions.push({
      actionId: "theory-badge-graph.load_payloads_to_calculator",
      label: "Load scalar cuts",
      panelId: "theory-badge-graph",
      args: { badge_id: args.scalarCutBadgeIds[0] },
      mutatesCalculator: true,
      solves: false,
    });
  }

  if (args.runtimeTraceBadgeIds.length > 0) {
    actions.push({
      actionId: "theory-badge-graph.get_runtime_math_trace",
      label: "Get runtime math trace",
      panelId: "theory-badge-graph",
      args: { badge_id: args.runtimeTraceBadgeIds[0] },
      mutatesCalculator: false,
      solves: false,
    });
  }

  return actions;
}

function step(args: {
  index: number;
  role: TheoryContextExplanationStepRoleV1;
  title: string;
  badgeIds: string[];
  summary: string;
  calculatorReady?: boolean;
  runtimeReady?: boolean;
  boundaryOnly?: boolean;
  claimBoundaryNotes?: string[];
}): TheoryContextExplanationStepV1 {
  return {
    id: `theory-context-explanation-step:${args.role}:${args.index}`,
    index: args.index,
    title: args.title,
    badgeIds: unique(args.badgeIds),
    role: args.role,
    summary: args.summary,
    calculatorReady: args.calculatorReady ?? false,
    runtimeReady: args.runtimeReady ?? false,
    boundaryOnly: args.boundaryOnly ?? false,
    claimBoundaryNotes: unique(args.claimBoundaryNotes ?? []),
  };
}

export function buildTheoryContextExplanationPlan(
  args: BuildTheoryContextExplanationPlanInput,
): TheoryContextExplanationPlanV1 {
  const badges = badgeMap(args.graph);
  const edges = edgeMap(args.graph);
  const reflectedBadgeIds = unique([
    ...args.reflection.overlay.centerBadgeIds,
    ...args.reflection.overlay.exactBadgeIds,
    ...args.reflection.overlay.likelyBadgeIds,
    ...args.reflection.overlay.highlightedBadgeIds,
  ]).filter((badgeId) => badges.has(badgeId));
  const selectedBadgeIds = reflectedBadgeIds.slice(0, 16);
  const trace = traceTheoryBadgeConnections({
    graph: args.graph,
    badgeIds: selectedBadgeIds.slice(0, 8),
  });
  const routeBadgeIds = unique([
    ...trace.sharedAncestorIds.slice(0, 4),
    ...trace.connectingBadgeIds,
    ...selectedBadgeIds,
  ]).filter((badgeId) => badges.has(badgeId));

  const firstPrincipleRoots = unique([
    ...selectedBadgeIds.filter((badgeId) => {
      const badge = badges.get(badgeId);
      return badge ? isFirstPrincipleRoot(badge) : false;
    }),
    ...trace.sharedAncestorIds,
    ...routeBadgeIds.filter((badgeId) => {
      const badge = badges.get(badgeId);
      return badge ? isFirstPrincipleRoot(badge) : false;
    }),
  ])
    .map((badgeId) => badges.get(badgeId))
    .filter((badge): badge is TheoryBadgeV1 => Boolean(badge))
    .slice(0, 8)
    .map((badge) => toNode(badge, "first_principle_root"));

  const branchNodes: TheoryContextExplanationNodeV1[] = [];
  const diagnosticNodes: TheoryContextExplanationNodeV1[] = [];
  const runtimeNodes: TheoryContextExplanationNodeV1[] = [];
  const claimBoundaryNodes: TheoryContextExplanationNodeV1[] = [];

  for (const badgeId of routeBadgeIds) {
    const badge = badges.get(badgeId);
    if (!badge) continue;
    const role = roleForBadge(badge);
    if (role === "first_principle_root") continue;
    const node = toNode(badge, selectedBadgeIds.includes(badge.id) ? "selected_context" : role);
    if (role === "claim_boundary") claimBoundaryNodes.push(toNode(badge, "claim_boundary"));
    else if (role === "runtime_or_evidence") runtimeNodes.push(node);
    else if (role === "diagnostic_branch") diagnosticNodes.push(node);
    else branchNodes.push(node);
  }

  const scalarCutBadgeIds = routeBadgeIds.filter((badgeId) => (badges.get(badgeId)?.calculatorPayloads.length ?? 0) > 0);
  const runtimeTraceBadgeIds = routeBadgeIds.filter((badgeId) => {
    const badge = badges.get(badgeId);
    return badge ? isRuntimeOrEvidenceBadge(badge) : false;
  });
  const connectingEdges = unique(trace.pathSegments.flatMap((segment) => segment.edgeIds))
    .map((edgeId) => edges.get(edgeId))
    .filter((edge): edge is TheoryBadgeEdgeV1 => Boolean(edge))
    .map((edge) => ({
      edgeId: edge.id,
      from: edge.from,
      to: edge.to,
      relation: edge.relation,
      label: edge.label || null,
    }));

  const claimBoundaryNotes = unique([
    ...args.reflection.evidenceForAsk.claimBoundaries,
    ...trace.claimBoundaryNotes,
    ...routeBadgeIds.flatMap((badgeId) => {
      const badge = badges.get(badgeId);
      return badge ? claimBoundaryNotesForBadge(badge) : [];
    }),
  ]);

  const explanationSteps: TheoryContextExplanationStepV1[] = [];
  let index = 1;
  if (firstPrincipleRoots.length > 0) {
    explanationSteps.push(step({
      index: index++,
      role: "first_principles",
      title: "First-principle roots",
      badgeIds: firstPrincipleRoots.map((node) => node.badgeId),
      summary: "Start from the shared law, tensor, conservation, or constant badges that anchor this discussion.",
      claimBoundaryNotes,
    }));
  }
  if (branchNodes.length > 0) {
    explanationSteps.push(step({
      index: index++,
      role: "branch_context",
      title: "Theory branch context",
      badgeIds: branchNodes.map((node) => node.badgeId),
      summary: "Follow the graph outward into the model or observable branch that gives the prompt its local context.",
      calculatorReady: branchNodes.some((node) => scalarCutBadgeIds.includes(node.badgeId)),
      claimBoundaryNotes,
    }));
  }
  if (diagnosticNodes.length > 0) {
    explanationSteps.push(step({
      index: index++,
      role: "diagnostic_context",
      title: "Diagnostic and scalar-cut context",
      badgeIds: diagnosticNodes.map((node) => node.badgeId),
      summary: "Use diagnostic rows and scalar cuts as transparent comparisons; they do not promote the claim tier by themselves.",
      calculatorReady: diagnosticNodes.some((node) => scalarCutBadgeIds.includes(node.badgeId)),
      runtimeReady: diagnosticNodes.some((node) => runtimeTraceBadgeIds.includes(node.badgeId)),
      claimBoundaryNotes,
    }));
  }
  if (runtimeNodes.length > 0) {
    explanationSteps.push(step({
      index: index++,
      role: "runtime_evidence_context",
      title: "Runtime and evidence context",
      badgeIds: runtimeNodes.map((node) => node.badgeId),
      summary: "Runtime/evidence rows indicate where a tensor, system, artifact, or gate receipt is needed before stronger interpretation.",
      runtimeReady: true,
      claimBoundaryNotes,
    }));
  }
  if (claimBoundaryNodes.length > 0 || claimBoundaryNotes.length > 0) {
    explanationSteps.push(step({
      index: index++,
      role: "claim_boundary",
      title: "Claim boundary",
      badgeIds: claimBoundaryNodes.map((node) => node.badgeId),
      summary: "Keep the interpretation inside the graph's diagnostic/proxy boundary unless a completed solver path provides valid receipts.",
      boundaryOnly: true,
      claimBoundaryNotes,
    }));
  }

  return buildTheoryContextExplanationPlanV1({
    generatedAt: args.generatedAt,
    planId: args.planId,
    graphId: args.graph.graphId,
    reflectionId: args.reflection.reflectionId,
    source: {
      kind: "theory_context_reflection",
      prompt: args.reflection.input.prompt,
      confidenceMode: args.reflection.input.confidenceMode,
    },
    inferredDomains: args.reflection.inferredDomains,
    selectedBadgeIds,
    firstPrincipleRoots,
    branchNodes,
    diagnosticNodes,
    runtimeNodes,
    claimBoundaryNodes,
    connectingEdges,
    explanationSteps,
    scalarCutBadgeIds,
    runtimeTraceBadgeIds,
    claimBoundaryNotes,
    recommendedNextActions: recommendedActions({ selectedBadgeIds, scalarCutBadgeIds, runtimeTraceBadgeIds }),
  });
}
