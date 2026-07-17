import type {
  TheoryBadgeGraphV1,
  TheoryBadgeSourceRefV1,
  TheoryBadgeV1,
} from "../../../../shared/contracts/theory-badge-graph.v1";
import type {
  TheoryContextExplanationNodeV1,
  TheoryContextExplanationPlanV1,
} from "../../../../shared/contracts/theory-context-explanation-plan.v1";
import type { TheoryContextReflectionV1 } from "../../../../shared/contracts/theory-context-reflection.v1";
import type { TheoryMasterProblemRequestV1 } from "../../../../shared/contracts/theory-master-problem.v1";
import type {
  HelixScholarlyFullTextObservation,
  HelixScholarlyResearchObservation,
} from "../../../../shared/helix-scholarly-research-observation";
import {
  HELIX_THEORY_CONGRUENCE_TRACE_SCHEMA,
  type HelixAskDepth,
  type TheoryCongruenceTraceV1,
  type TheoryToolAdmissionDecision,
  type TheoryToolKind,
} from "../../../../shared/helix-theory-congruence-trace";
import { scanForbiddenTheoryClaims } from "./forbidden-claims";
import {
  buildCalculatorObservation,
  buildForbiddenClaimObservation,
  buildPhysicsAtlasObservation,
  buildRepoSourceObservation,
  buildTheoryGraphObservation,
} from "./observations";
import {
  buildScholarlyPaperSources,
  buildScholarlyTheoryObservation,
} from "./scholarly-observation";
import { selectTheoryDepth } from "./depth-policy";
import { buildTheoryToolAdmissionPlan } from "./tool-admission";
import { compileTheoryMasterProblem } from "../../../../shared/theory/theory-master-problem-compiler";
import { compileTheoryDerivationProgram } from "../../../../shared/theory/theory-derivation-program-compiler";

export type TheoryCongruenceTraceFeatureFlagMode = "off" | "shadow" | "on";

export type BuildTheoryCongruenceTraceInput = {
  graph: TheoryBadgeGraphV1;
  turnId: string;
  prompt: string;
  reflection: TheoryContextReflectionV1;
  explanationPlan: TheoryContextExplanationPlanV1 | null;
  explicitDepth?: HelixAskDepth | null;
  sourceTargetIntent?: {
    target_source?: string | null;
    target_kind?: string | null;
    precedence_reason?: string | null;
  } | null;
  routeCandidate?: string | null;
  draftText?: string | null;
  featureFlagMode?: TheoryCongruenceTraceFeatureFlagMode;
  scholarlyResearchObservation?: HelixScholarlyResearchObservation | null;
  scholarlyFullTextObservation?: HelixScholarlyFullTextObservation | null;
  scholarlyMetadataFailed?: boolean;
  derivationRequest?: TheoryMasterProblemRequestV1;
};

const CURRENT_INFO_CUE = /\b(today|latest|current|currently|recent|newest|as of now|live)\b/i;
const EXACT_PAPER_ID = /\barxiv:\s*[0-9]{4}\.[0-9]{4,5}(?:v\d+)?\b|\bdoi:\s*10\.\S+/i;

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function newTraceId(turnId: string): string {
  return `helix-theory-congruence-trace:${turnId}:${Date.now().toString(36)}`;
}

function sourceRefId(ref: Pick<TheoryBadgeSourceRefV1, "path" | "id">): string {
  return ref.path ?? ref.id ?? "";
}

function nodeSourceRefs(node: TheoryContextExplanationNodeV1): string[] {
  return node.sourceRefs.map((ref) => ref.path ?? ref.id ?? "").filter(Boolean);
}

function selectedBadgeIds(args: {
  reflection: TheoryContextReflectionV1;
  explanationPlan: TheoryContextExplanationPlanV1 | null;
}): string[] {
  return unique([
    ...(args.explanationPlan?.selectedBadgeIds ?? []),
    ...args.reflection.exactMatches.map((match) => match.badgeId),
    ...args.reflection.likelyMatches.map((match) => match.badgeId),
    ...args.reflection.overlay.centerBadgeIds,
    ...args.reflection.overlay.highlightedBadgeIds,
  ]);
}

function compilationBadgeIds(reflection: TheoryContextReflectionV1): string[] {
  const exactBadgeIds = unique(reflection.exactMatches.map((match) => match.badgeId));
  if (exactBadgeIds.length > 0) return exactBadgeIds;
  // Likely matches remain usable for explicitly conditional, open-world
  // compilation when no direct identity exists. Once an exact identity cut is
  // available, graph-neighborhood and explanation badges remain context only
  // and must not add unrelated equations or missing inputs to the program.
  return unique(reflection.likelyMatches.map((match) => match.badgeId));
}

function hasRepoSourceRefs(badges: TheoryBadgeV1[], plan: TheoryContextExplanationPlanV1 | null): boolean {
  if (badges.some((badge) => badge.sourceRefs.some((ref) => Boolean(ref.path)))) return true;
  const nodes = [
    ...(plan?.firstPrincipleRoots ?? []),
    ...(plan?.branchNodes ?? []),
    ...(plan?.diagnosticNodes ?? []),
    ...(plan?.runtimeNodes ?? []),
    ...(plan?.claimBoundaryNodes ?? []),
  ];
  return nodes.some((node) => node.sourceRefs.some((ref) => Boolean(ref.path)));
}

function badgeRole(badge: TheoryBadgeV1): TheoryCongruenceTraceV1["theory_badges"][number]["role"] {
  if (badge.level === "claim_boundary") return "claim_boundary";
  if (badge.calculatorPayloads.length > 0) return "calculator_row";
  if (badge.equations.some((equation) => equation.operatorKind === "scalar_expression")) return "equation";
  if (badge.subjects.some((subject) => /observable|observation|diagnostic|measurement/i.test(subject))) {
    return "observable";
  }
  return "concept";
}

function sourceRole(
  ref: TheoryBadgeSourceRefV1,
  badge: TheoryBadgeV1,
): TheoryCongruenceTraceV1["repo_sources"][number]["role"] {
  if (badge.level === "claim_boundary") return "boundary";
  if (ref.kind === "repo_module") return "implementation";
  if (ref.kind === "test") return "test";
  if (ref.kind === "doc" || ref.kind === "artifact") return "doc";
  return "definition";
}

function candidateAnswerKind(depth: HelixAskDepth): TheoryCongruenceTraceV1["solver_boundary"]["candidate_answer_kind"] {
  if (depth === "direct") return "direct_answer";
  if (depth === "source_grounded") return "repo_code_evidence_answer";
  return "theory_congruence_answer";
}

function attachObservationIds(
  decisions: TheoryToolAdmissionDecision[],
  observations: TheoryCongruenceTraceV1["observations"],
): TheoryToolAdmissionDecision[] {
  const byLane = new Map<string, string>(observations.map((observation) => [observation.lane, observation.id]));
  return decisions.map((decision) => {
    const observationId = byLane.get(decision.tool);
    return observationId ? { ...decision, observation_id: observationId } : decision;
  });
}

function isAdmitted(
  decisions: TheoryToolAdmissionDecision[],
  tool: TheoryToolKind,
): boolean {
  return decisions.some((decision) => decision.tool === tool && decision.status === "admitted");
}

function defaultDerivationRequest(prompt: string, depth: HelixAskDepth): TheoryMasterProblemRequestV1 {
  return {
    operation: "explain",
    target: prompt.trim() || "theory graph reflection",
    targetObservable: null,
    scaleLog10M: null,
    coordinateFrame: null,
    initialBoundaryConditions: [],
    formalSystem: null,
    requestedPrecision: null,
    evidenceMaturityCeiling: depth === "direct"
      ? "exploratory"
      : depth === "source_grounded"
        ? "reduced_order"
        : "diagnostic",
    normalizationStatus: "provisional",
  };
}

export function buildTheoryCongruenceTrace(
  input: BuildTheoryCongruenceTraceInput,
): TheoryCongruenceTraceV1 {
  const depthSelection = selectTheoryDepth({
    prompt: input.prompt,
    explicitDepth: input.explicitDepth,
    sourceTargetIntent: input.sourceTargetIntent,
    routeCandidate: input.routeCandidate,
  });
  const badgeMap = new Map(input.graph.badges.map((badge) => [badge.id, badge]));
  const ids = selectedBadgeIds({
    reflection: input.reflection,
    explanationPlan: input.explanationPlan,
  });
  const badges = ids.map((id) => badgeMap.get(id)).filter((badge): badge is TheoryBadgeV1 => Boolean(badge));
  const hasCalculatorRows =
    badges.some((badge) => badge.calculatorPayloads.length > 0) ||
    (input.explanationPlan?.scalarCutBadgeIds.length ?? 0) > 0;
  const candidateTools = buildTheoryToolAdmissionPlan({
    prompt: input.prompt,
    depth: depthSelection.depth,
    hasCalculatorRows,
    hasRepoSourceRefs: hasRepoSourceRefs(badges, input.explanationPlan),
    hasExactPaperId: EXACT_PAPER_ID.test(input.prompt),
    hasCurrentInfoCue: CURRENT_INFO_CUE.test(input.prompt),
    featureFlagMode: input.featureFlagMode ?? "shadow",
  });
  const forbiddenScan = scanForbiddenTheoryClaims(input.draftText ?? input.prompt);
  const observations: TheoryCongruenceTraceV1["observations"] = [];
  if (isAdmitted(candidateTools, "theory_badge_graph")) {
    observations.push(buildTheoryGraphObservation({ turnId: input.turnId, reflection: input.reflection }));
  }
  if (isAdmitted(candidateTools, "physics_atlas")) {
    observations.push(buildPhysicsAtlasObservation({ turnId: input.turnId, reflection: input.reflection }));
  }
  if (isAdmitted(candidateTools, "calculator_loadout")) {
    observations.push(buildCalculatorObservation({ turnId: input.turnId, explanationPlan: input.explanationPlan }));
  }
  if (isAdmitted(candidateTools, "repo_search")) {
    observations.push(buildRepoSourceObservation({ turnId: input.turnId, explanationPlan: input.explanationPlan }));
  }
  if (isAdmitted(candidateTools, "scholarly_probe")) {
    observations.push(buildScholarlyTheoryObservation({
      turnId: input.turnId,
      researchObservation: input.scholarlyResearchObservation,
      fullTextObservation: input.scholarlyFullTextObservation,
      metadataFailed: input.scholarlyMetadataFailed,
    }));
  }
  observations.push(buildForbiddenClaimObservation({
    turnId: input.turnId,
    status: forbiddenScan.status,
    forbiddenTermsFound: forbiddenScan.forbidden_terms_found,
  }));

  const nodes = [
    ...(input.explanationPlan?.firstPrincipleRoots ?? []),
    ...(input.explanationPlan?.branchNodes ?? []),
    ...(input.explanationPlan?.diagnosticNodes ?? []),
    ...(input.explanationPlan?.runtimeNodes ?? []),
    ...(input.explanationPlan?.claimBoundaryNodes ?? []),
  ];
  const nodeMap = new Map(nodes.map((node) => [node.badgeId, node]));
  const selectedIdSet = new Set(ids);
  const graphEdges = input.graph.edges.filter((edge) => selectedIdSet.has(edge.from) || selectedIdSet.has(edge.to));
  const selectedEdges = input.graph.edges.filter((edge) => selectedIdSet.has(edge.from) && selectedIdSet.has(edge.to));
  const missingEvidence = observations.flatMap((observation) => observation.missing_requirements);
  const requiredBlocked = candidateTools.filter((decision) => decision.required && decision.status === "blocked");
  const paperSources = buildScholarlyPaperSources({
    turnId: input.turnId,
    researchObservation: input.scholarlyResearchObservation,
    fullTextObservation: input.scholarlyFullTextObservation,
    metadataFailed: input.scholarlyMetadataFailed,
  });
  const derivationRequest = input.derivationRequest ?? defaultDerivationRequest(input.prompt, depthSelection.depth);
  const masterBadgeIds = compilationBadgeIds(input.reflection);
  const masterProblem = compileTheoryMasterProblem({
    graph: input.graph,
    badgeIds: masterBadgeIds,
    request: derivationRequest,
    comparisonBadgeIds: derivationRequest.operation === "compare"
      ? input.reflection.exactMatches.map((match) => match.badgeId)
      : undefined,
    uncertainty: {
      placementEntropyBits: input.reflection.overlay.uncertainty?.posteriorEntropyBits ?? 0,
      openWorldEntropyBits: input.reflection.overlay.uncertainty?.openWorldEntropyBits ?? 0,
      outOfGraphProbability: input.reflection.overlay.uncertainty?.outOfGraphProbability ?? 0,
    },
  });
  const derivationProgram = compileTheoryDerivationProgram({ masterProblem });
  const derivationProgramMissingEvidence = derivationProgram.status === "ready"
    ? []
    : unique([
        ...derivationProgram.failureReceipts.map((receipt) => receipt.message),
        ...derivationProgram.obligations
          .filter((obligation) =>
            obligation.phase === "preflight" &&
            (obligation.status === "required" || obligation.status === "blocked")
          )
          .map((obligation) => obligation.description),
      ]);
  const status = forbiddenScan.status === "fail"
    ? "unsatisfied"
    : missingEvidence.length > 0 || requiredBlocked.length > 0 || derivationProgramMissingEvidence.length > 0
      ? "partial"
      : "satisfied";

  return {
    schema: HELIX_THEORY_CONGRUENCE_TRACE_SCHEMA,
    trace_id: newTraceId(input.turnId),
    turn_id: input.turnId,
    ...(input.explicitDepth ? { depth_requested: input.explicitDepth } : {}),
    depth_selected: depthSelection.depth,
    depth_reason: depthSelection.reason,
    candidate_tools: attachObservationIds(candidateTools, observations),
    observations,
    first_principles: (input.explanationPlan?.firstPrincipleRoots ?? []).map((node) => ({
      id: node.badgeId,
      label: node.title,
      role: node.role === "claim_boundary"
        ? "boundary_condition"
        : node.expression || node.displayLatex
          ? "equation"
          : "anchor",
      source_refs: nodeSourceRefs(node),
    })),
    theory_badges: badges.map((badge) => ({
      badge_id: badge.id,
      label: badge.title,
      role: badgeRole(badge),
      connected_badge_ids: unique(graphEdges
        .filter((edge) => edge.from === badge.id || edge.to === badge.id)
        .map((edge) => edge.from === badge.id ? edge.to : edge.from)),
      source_refs: badge.sourceRefs.map(sourceRefId).filter(Boolean),
    })),
    calculator_payloads: badges.flatMap((badge): TheoryCongruenceTraceV1["calculator_payloads"] => {
      if (badge.calculatorPayloads.length === 0) {
        return badge.equations
          .filter((equation) => equation.operatorKind === "noncomputable_reference")
          .map((equation) => ({
            row_id: `${badge.id}:${equation.id}`,
            expression_id: equation.id,
            status: "reference_only" as const,
            variables: unique([...equation.inputSymbols, ...equation.outputSymbols]),
            units: badge.units.map((unit) => `${unit.symbol}:${unit.unit ?? "dimensionless"}`),
          }));
      }
      return badge.calculatorPayloads.map((payload) => ({
        row_id: `${badge.id}:${payload.id}`,
        expression_id: payload.id,
        status: "loadable" as const,
        variables: unique(badge.equations.flatMap((equation) => [...equation.inputSymbols, ...equation.outputSymbols])),
        units: badge.units.map((unit) => `${unit.symbol}:${unit.unit ?? "dimensionless"}`),
      }));
    }),
    repo_sources: badges.flatMap((badge) =>
      badge.sourceRefs
        .filter((ref) => Boolean(ref.path))
        .map((ref, index) => ({
          ref_id: `${badge.id}:source:${index}`,
          path: ref.path as string,
          role: sourceRole(ref, badge),
        })),
    ),
    paper_sources: paperSources,
    inferred_links: (input.explanationPlan?.connectingEdges.length
      ? input.explanationPlan.connectingEdges.map((edge) => ({
          from: edge.from,
          to: edge.to,
          synthesis: edge.label ?? edge.relation,
          support_level: "badge_edge" as const,
          caveat: "Badge edges orient retrieval and reasoning; they do not validate physics claims.",
        }))
      : selectedEdges.slice(0, 12).map((edge) => ({
          from: edge.from,
          to: edge.to,
          synthesis: edge.label,
          support_level: "badge_edge" as const,
          caveat: edge.claimBoundaryNote,
        }))),
    master_problem: masterProblem,
    derivation_program: derivationProgram,
    claim_boundaries: unique([
      ...input.reflection.evidenceForAsk.claimBoundaries,
      ...(input.explanationPlan?.claimBoundaryNotes ?? []),
      ...badges.flatMap((badge) => badge.assumptions.filter((assumption) => /claim|validat|boundary|diagnostic/i.test(assumption))),
    ]).map((text, index) => ({
      boundary_id: `claim-boundary:${index + 1}`,
      text,
      applies_to: badges
        .filter((badge) => badge.level === "claim_boundary" || badge.assumptions.includes(text))
        .map((badge) => badge.id),
      severity: forbiddenScan.status === "fail" ? "fail_closed" : "guard",
    })),
    forbidden_claim_scan: forbiddenScan,
    goal_satisfaction: {
      status,
      missing_evidence: unique([
        ...missingEvidence,
        ...derivationProgramMissingEvidence,
        ...requiredBlocked.map((decision) => decision.blocked_reason ?? decision.reason),
      ]),
      ...(requiredBlocked[0] ? { next_best_tool: requiredBlocked[0].tool } : {}),
    },
    solver_boundary: {
      eligible_for_answer: false,
      candidate_answer_kind: forbiddenScan.status === "fail" ? "typed_failure" : candidateAnswerKind(depthSelection.depth),
      completed_solver_path_required: true,
      reason: forbiddenScan.status === "fail"
        ? "Forbidden claim language must be repaired before terminal synthesis."
        : "Theory congruence trace is non-terminal evidence; completed Ask solver path owns the final answer.",
    },
    assistant_answer: false,
    raw_content_included: false,
    terminal_eligible: false,
  };
}
