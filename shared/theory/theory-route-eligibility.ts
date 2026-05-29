import type {
  TheoryBadgeEdgeV1,
  TheoryBadgeEquationV1,
  TheoryBadgeGraphV1,
  TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";
import { findTheoryRuntimeEntrypointsForBadge } from "./runtime-entrypoints";

export const THEORY_ROUTE_CLAIM_LEVELS = ["CL0", "CL1", "CL2", "CL3", "CL4"] as const;

export const THEORY_ROUTE_ELIGIBILITY_REASONS = [
  "allowed",
  "blocked_link",
  "conceptual_disallowed",
  "proxy_disallowed",
  "claim_level_exceeds_allowed",
  "chart_mismatch",
  "condition_unsatisfied",
  "missing_runtime_entrypoint",
  "missing_evidence",
  "claim_boundary",
] as const;

export type TheoryRouteClaimLevel = (typeof THEORY_ROUTE_CLAIM_LEVELS)[number];
export type TheoryRouteEligibilityReason = (typeof THEORY_ROUTE_ELIGIBILITY_REASONS)[number];
export type TheoryRouteEligibilityDecision = "allowed" | "blocked";

export type TheoryRouteBadgeEligibilityV1 = {
  badgeId: string;
  decision: TheoryRouteEligibilityDecision;
  reason: TheoryRouteEligibilityReason;
  details: string[];
  labels: string[];
  runtimeEntrypointIds: string[];
  evidenceRefCount: number;
  claimBoundaryNotes: string[];
};

export type TheoryRouteEdgeEligibilityV1 = {
  edgeId: string;
  from: string;
  to: string;
  decision: TheoryRouteEligibilityDecision;
  reason: TheoryRouteEligibilityReason;
  details: string[];
};

export type TheoryRouteEligibilityResultV1 = {
  graphId: string;
  startBadgeIds: string[];
  allowedClaimLevel: TheoryRouteClaimLevel;
  allowProxyEdges: boolean;
  chart: string | null;
  badges: TheoryRouteBadgeEligibilityV1[];
  edges: TheoryRouteEdgeEligibilityV1[];
  summary: {
    badgeCount: number;
    allowedBadgeCount: number;
    blockedBadgeCount: number;
    edgeCount: number;
    allowedEdgeCount: number;
    blockedEdgeCount: number;
    blockedReasons: Record<string, number>;
  };
};

type RegionSignals = Record<string, string | number | boolean | null | undefined>;

const CLAIM_LEVEL_SCORE: Record<TheoryRouteClaimLevel, number> = {
  CL0: 0,
  CL1: 1,
  CL2: 2,
  CL3: 3,
  CL4: 4,
};

const SCALAR_LABEL = "scalar-solvable";
const TENSOR_RUNTIME_LABEL = "tensor/runtime";
const RUNTIME_ENTRYPOINT_LABEL = "runtime entrypoint available";
const GATE_LABEL = "gate";
const BOUNDARY_LABEL = "boundary";
const REFERENCE_LABEL = "reference only";
const EVIDENCE_PRESENT_LABEL = "evidence refs present";
const MISSING_EVIDENCE_LABEL = "missing evidence";
const DIAGNOSTIC_ONLY_LABEL = "diagnostic only";
const CERTIFICATE_REQUIRED_LABEL = "certificate required";

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function hasRuntimeEquation(equation: TheoryBadgeEquationV1): boolean {
  return (
    equation.operatorKind === "tensor_component" ||
    equation.operatorKind === "field_sample" ||
    equation.operatorKind === "region_aggregate" ||
    equation.operatorKind === "worldline_integral"
  );
}

function hasReferenceEquation(equation: TheoryBadgeEquationV1): boolean {
  return equation.operatorKind === "noncomputable_reference" || equation.role === "noncomputable_reference";
}

function requiresRuntimeEntrypoint(badge: TheoryBadgeV1): boolean {
  return badge.id.includes(".runtime.") || badge.equations.some(hasRuntimeEquation);
}

function badgeClaimLevel(badge: TheoryBadgeV1): TheoryRouteClaimLevel {
  switch (badge.level) {
    case "first_principle":
      return "CL0";
    case "law":
    case "derived_relation":
      return "CL1";
    case "model":
      return "CL2";
    case "simulation_specific":
    case "diagnostic_gate":
      return "CL3";
    case "claim_boundary":
      return "CL4";
    default:
      return "CL2";
  }
}

function claimBoundaryNotesForBadge(badge: TheoryBadgeV1): string[] {
  const notes: string[] = [];
  if (badge.claimBoundary.diagnosticOnly) notes.push(`${badge.id}: diagnostic-only`);
  if (!badge.claimBoundary.validationClaimAllowed) notes.push(`${badge.id}: validation claim not allowed`);
  if (!badge.claimBoundary.physicalMechanismClaimAllowed) {
    notes.push(`${badge.id}: physical mechanism claim not allowed`);
  }
  if (!badge.claimBoundary.promotionAllowed) notes.push(`${badge.id}: promotion not allowed`);
  return notes;
}

function requiredSignalsForBadge(badge: TheoryBadgeV1): string[] {
  return unique(
    [...badge.tags, ...badge.hintKeys.subjects, ...badge.hintKeys.equationFamilies]
      .map((token) => token.match(/^requires:([A-Za-z0-9_.-]+)$/)?.[1] ?? "")
      .filter(Boolean),
  );
}

function chartTokensForBadge(badge: TheoryBadgeV1): string[] {
  return unique(
    [...badge.tags, ...badge.hintKeys.subjects, ...badge.hintKeys.equationFamilies]
      .map((token) => token.match(/^chart:([A-Za-z0-9_.-]+)$/)?.[1] ?? "")
      .filter(Boolean),
  );
}

function labelsForBadge(args: {
  badge: TheoryBadgeV1;
  runtimeEntrypointIds: string[];
  evidenceRefCount: number;
}): string[] {
  const labels: string[] = [];
  if (args.badge.calculatorPayloads.length > 0) labels.push(SCALAR_LABEL);
  if (args.badge.equations.some(hasRuntimeEquation) || args.badge.id.includes(".runtime.")) {
    labels.push(TENSOR_RUNTIME_LABEL);
  }
  if (args.runtimeEntrypointIds.length > 0) labels.push(RUNTIME_ENTRYPOINT_LABEL);
  if (args.badge.equations.some((equation) => equation.operatorKind === "gate_status")) labels.push(GATE_LABEL);
  if (args.badge.level === "claim_boundary") labels.push(BOUNDARY_LABEL);
  if (args.badge.equations.some(hasReferenceEquation)) labels.push(REFERENCE_LABEL);
  if (args.evidenceRefCount > 0) labels.push(EVIDENCE_PRESENT_LABEL);
  else labels.push(MISSING_EVIDENCE_LABEL);
  if (args.badge.claimBoundary.diagnosticOnly) labels.push(DIAGNOSTIC_ONLY_LABEL);
  if (!args.badge.claimBoundary.promotionAllowed) labels.push(CERTIFICATE_REQUIRED_LABEL);
  return unique(labels);
}

function resolveBadgeDecision(args: {
  badge: TheoryBadgeV1;
  allowedClaimLevel: TheoryRouteClaimLevel;
  allowProxyEdges: boolean;
  chart: string | null;
  regionSignals: RegionSignals;
  requireEvidence: boolean;
}): Omit<TheoryRouteBadgeEligibilityV1, "labels" | "runtimeEntrypointIds" | "evidenceRefCount" | "claimBoundaryNotes"> {
  const badge = args.badge;
  if (badge.level === "claim_boundary") {
    return {
      badgeId: badge.id,
      decision: "blocked",
      reason: "claim_boundary",
      details: ["Claim-boundary badge blocks promotion unless a later policy adapter proves otherwise."],
    };
  }

  if (badge.claimBoundary.diagnosticOnly && CLAIM_LEVEL_SCORE[args.allowedClaimLevel] >= CLAIM_LEVEL_SCORE.CL4) {
    return {
      badgeId: badge.id,
      decision: "blocked",
      reason: "claim_boundary",
      details: ["Diagnostic-only badge cannot support CL4/certified interpretation."],
    };
  }

  if (CLAIM_LEVEL_SCORE[badgeClaimLevel(badge)] > CLAIM_LEVEL_SCORE[args.allowedClaimLevel]) {
    return {
      badgeId: badge.id,
      decision: "blocked",
      reason: "claim_level_exceeds_allowed",
      details: [`Badge requires ${badgeClaimLevel(badge)} but route allows ${args.allowedClaimLevel}.`],
    };
  }

  if (!args.allowProxyEdges && (badge.tags.includes("proxy") || badge.subjects.includes("proxy"))) {
    return {
      badgeId: badge.id,
      decision: "blocked",
      reason: "proxy_disallowed",
      details: ["Proxy badge is blocked by allowProxyEdges=false."],
    };
  }

  const chartTokens = chartTokensForBadge(badge);
  if (args.chart && chartTokens.length > 0 && !chartTokens.includes(args.chart)) {
    return {
      badgeId: badge.id,
      decision: "blocked",
      reason: "chart_mismatch",
      details: [`Badge chart ${chartTokens.join(", ")} does not match requested chart ${args.chart}.`],
    };
  }

  const missingSignals = requiredSignalsForBadge(badge).filter((signal) => !args.regionSignals[signal]);
  if (missingSignals.length > 0) {
    return {
      badgeId: badge.id,
      decision: "blocked",
      reason: "condition_unsatisfied",
      details: [`Missing required signal(s): ${missingSignals.join(", ")}.`],
    };
  }

  const runtimeEntrypoints = findTheoryRuntimeEntrypointsForBadge(badge.id);
  if (requiresRuntimeEntrypoint(badge) && runtimeEntrypoints.length === 0) {
    return {
      badgeId: badge.id,
      decision: "blocked",
      reason: "missing_runtime_entrypoint",
      details: ["Runtime/tensor badge has no typed runtime entrypoint in the registry."],
    };
  }

  if (args.requireEvidence && badge.sourceRefs.length === 0) {
    return {
      badgeId: badge.id,
      decision: "blocked",
      reason: "missing_evidence",
      details: ["Badge has no source refs or artifact refs for evidence-map interpretation."],
    };
  }

  return {
    badgeId: badge.id,
    decision: "allowed",
    reason: "allowed",
    details: [],
  };
}

function resolveEdgeDecision(args: {
  edge: TheoryBadgeEdgeV1;
  fromDecision: TheoryRouteBadgeEligibilityV1 | undefined;
  toDecision: TheoryRouteBadgeEligibilityV1 | undefined;
  allowProxyEdges: boolean;
  regionSignals: RegionSignals;
}): TheoryRouteEdgeEligibilityV1 {
  if (args.edge.relation === "blocks") {
    return {
      edgeId: args.edge.id,
      from: args.edge.from,
      to: args.edge.to,
      decision: "blocked",
      reason: "blocked_link",
      details: [args.edge.claimBoundaryNote || args.edge.label || "Edge is an explicit blocking relation."],
    };
  }

  if (!args.allowProxyEdges && args.edge.relation === "approximates") {
    return {
      edgeId: args.edge.id,
      from: args.edge.from,
      to: args.edge.to,
      decision: "blocked",
      reason: "proxy_disallowed",
      details: ["Approximation/proxy edge is blocked by allowProxyEdges=false."],
    };
  }

  const requiredSignal = (args.edge.label + " " + args.edge.claimBoundaryNote).match(/requires:([A-Za-z0-9_.-]+)/)?.[1];
  if (requiredSignal && !args.regionSignals[requiredSignal]) {
    return {
      edgeId: args.edge.id,
      from: args.edge.from,
      to: args.edge.to,
      decision: "blocked",
      reason: "condition_unsatisfied",
      details: [`Missing required edge signal: ${requiredSignal}.`],
    };
  }

  const blockedEndpoint = [args.fromDecision, args.toDecision].find((decision) => decision?.decision === "blocked");
  if (blockedEndpoint) {
    return {
      edgeId: args.edge.id,
      from: args.edge.from,
      to: args.edge.to,
      decision: "blocked",
      reason: blockedEndpoint.reason,
      details: [`Endpoint ${blockedEndpoint.badgeId} is blocked: ${blockedEndpoint.reason}.`],
    };
  }

  return {
    edgeId: args.edge.id,
    from: args.edge.from,
    to: args.edge.to,
    decision: "allowed",
    reason: "allowed",
    details: [],
  };
}

export function resolveTheoryRouteEligibility(args: {
  graph: TheoryBadgeGraphV1;
  startBadgeIds?: string[];
  allowedClaimLevel?: TheoryRouteClaimLevel;
  allowProxyEdges?: boolean;
  chart?: string | null;
  regionSignals?: RegionSignals;
  requireEvidence?: boolean;
}): TheoryRouteEligibilityResultV1 {
  const allowedClaimLevel = args.allowedClaimLevel ?? "CL3";
  const allowProxyEdges = args.allowProxyEdges ?? true;
  const chart = args.chart ?? null;
  const regionSignals = args.regionSignals ?? {};
  const startBadgeIds = unique(args.startBadgeIds ?? []);
  const badges = args.graph.badges.map((badge) => {
    const runtimeEntrypoints = findTheoryRuntimeEntrypointsForBadge(badge.id);
    const evidenceRefCount = badge.sourceRefs.length;
    const base = resolveBadgeDecision({
      badge,
      allowedClaimLevel,
      allowProxyEdges,
      chart,
      regionSignals,
      requireEvidence: args.requireEvidence ?? false,
    });
    return {
      ...base,
      labels: labelsForBadge({
        badge,
        runtimeEntrypointIds: runtimeEntrypoints.map((entrypoint) => entrypoint.runtimeId),
        evidenceRefCount,
      }),
      runtimeEntrypointIds: runtimeEntrypoints.map((entrypoint) => entrypoint.runtimeId),
      evidenceRefCount,
      claimBoundaryNotes: claimBoundaryNotesForBadge(badge),
    };
  });
  const byBadgeId = new Map(badges.map((badge) => [badge.badgeId, badge]));
  const edges = args.graph.edges.map((edge) =>
    resolveEdgeDecision({
      edge,
      fromDecision: byBadgeId.get(edge.from),
      toDecision: byBadgeId.get(edge.to),
      allowProxyEdges,
      regionSignals,
    }),
  );
  const blockedReasons = [...badges, ...edges].reduce<Record<string, number>>((acc, decision) => {
    if (decision.decision === "blocked") acc[decision.reason] = (acc[decision.reason] ?? 0) + 1;
    return acc;
  }, {});

  return {
    graphId: args.graph.graphId,
    startBadgeIds,
    allowedClaimLevel,
    allowProxyEdges,
    chart,
    badges,
    edges,
    summary: {
      badgeCount: badges.length,
      allowedBadgeCount: badges.filter((badge) => badge.decision === "allowed").length,
      blockedBadgeCount: badges.filter((badge) => badge.decision === "blocked").length,
      edgeCount: edges.length,
      allowedEdgeCount: edges.filter((edge) => edge.decision === "allowed").length,
      blockedEdgeCount: edges.filter((edge) => edge.decision === "blocked").length,
      blockedReasons,
    },
  };
}
