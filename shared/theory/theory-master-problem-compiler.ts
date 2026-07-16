import {
  buildTheoryMasterProblemV1,
  type TheoryMasterProblemBridgeOperatorV1,
  type TheoryMasterProblemCompileStatusV1,
  type TheoryMasterProblemEdgeV1,
  type TheoryMasterProblemNodeV1,
  type TheoryMasterProblemRequestV1,
  type TheoryMasterProblemResultKindV1,
  type TheoryMasterProblemV1,
} from "../contracts/theory-master-problem.v1";
import type {
  TheoryBadgeEdgeRelation,
  TheoryBadgeEquationV1,
  TheoryBadgeGraphV1,
  TheoryBadgeSourceRefV1,
  TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";

export type CompileTheoryMasterProblemInput = {
  graph: TheoryBadgeGraphV1;
  badgeIds: string[];
  request: TheoryMasterProblemRequestV1;
  uncertainty?: {
    placementEntropyBits?: number;
    openWorldEntropyBits?: number;
    outOfGraphProbability?: number;
  };
  generatedAt?: string;
  planId?: string;
};

const RUNTIME_OPERATOR_KINDS = new Set([
  "field_sample",
  "tensor_component",
  "region_aggregate",
  "worldline_integral",
  "residual",
]);

const EDGE_OPERATOR: Record<TheoryBadgeEdgeRelation, TheoryMasterProblemBridgeOperatorV1> = {
  derives: "derives",
  requires: "requires",
  specializes: "specializes",
  approximates: "approximates_with_error",
  bounds: "bounds",
  shares_units: "unit_compatible",
  uses_constant: "parameter_binding",
  numerically_solves: "numerical_solver",
  diagnostic_checks: "diagnostic_check",
  documents: "provenance",
  blocks: "blocks",
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeSymbol(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function sourceRefId(ref: TheoryBadgeSourceRefV1): string {
  return ref.path ?? ref.id ?? "";
}

function claimBoundaryNotes(badge: TheoryBadgeV1): string[] {
  const notes: string[] = [];
  if (badge.claimBoundary.diagnosticOnly) notes.push("diagnostic_only");
  if (!badge.claimBoundary.validationClaimAllowed) notes.push("validation_claim_not_allowed");
  if (!badge.claimBoundary.physicalMechanismClaimAllowed) notes.push("physical_mechanism_claim_not_allowed");
  if (!badge.claimBoundary.promotionAllowed) notes.push("promotion_not_allowed");
  return notes;
}

function nodeKind(badge: TheoryBadgeV1, equation: TheoryBadgeEquationV1 | null): TheoryMasterProblemNodeV1["kind"] {
  if (badge.level === "claim_boundary") return "boundary";
  if (!equation) {
    return badge.subjects.some((subject) => /observable|measurement|diagnostic/i.test(subject)) ? "observable" : "concept";
  }
  if (equation.operatorKind === "noncomputable_reference" || equation.role === "noncomputable_reference") return "reference";
  if (equation.operatorKind === "gate_status" || equation.role === "gate") return "gate";
  if (equation.role === "constraint" || equation.role === "residual") return "constraint";
  if (badge.subjects.some((subject) => /observable|measurement/i.test(subject))) return "observable";
  return "equation";
}

function computabilityStatus(
  equation: TheoryBadgeEquationV1 | null,
): TheoryMasterProblemNodeV1["computabilityStatus"] {
  if (!equation) return "unknown";
  if (equation.operatorKind === "noncomputable_reference" || equation.role === "noncomputable_reference") {
    return "noncomputable_reference";
  }
  if (equation.operatorKind === "gate_status" || equation.role === "gate") return "gate_required";
  if (equation.computableExpression?.trim()) return "closed_form";
  if (equation.operatorKind && RUNTIME_OPERATOR_KINDS.has(equation.operatorKind)) return "runtime_required";
  return "unknown";
}

function buildNodes(badges: TheoryBadgeV1[]): TheoryMasterProblemNodeV1[] {
  return badges.flatMap((badge) => {
    const equations = badge.equations.length > 0 ? badge.equations : [null];
    return equations.map((equation): TheoryMasterProblemNodeV1 => ({
      id: `theory-master-node:${badge.id}:${equation?.id ?? "concept"}`,
      badgeId: badge.id,
      equationId: equation?.id ?? null,
      kind: nodeKind(badge, equation),
      title: equation ? `${badge.title}: ${equation.id}` : badge.title,
      displayLatex: equation?.displayLatex ?? null,
      expression: equation?.computableExpression ?? null,
      inputSymbols: equation?.inputSymbols ?? [],
      outputSymbols: equation?.outputSymbols ?? [],
      units: badge.units.map((unit) => ({
        symbol: unit.symbol,
        unit: unit.unit ?? null,
        dimensionSignature: unit.dimensionSignature ?? null,
      })),
      assumptions: badge.assumptions,
      sourceRefs: badge.sourceRefs.map(sourceRefId).filter(Boolean),
      derivationClass: "retrieved",
      computabilityStatus: computabilityStatus(equation),
      claimBoundaryNotes: claimBoundaryNotes(badge),
    }));
  });
}

function primaryNode(nodesByBadge: Map<string, TheoryMasterProblemNodeV1[]>, badgeId: string): TheoryMasterProblemNodeV1 | null {
  const nodes = nodesByBadge.get(badgeId) ?? [];
  return nodes.find((node) => node.outputSymbols.length > 0) ?? nodes[0] ?? null;
}

function dimensionFor(node: TheoryMasterProblemNodeV1, symbol: string): string | null {
  const key = normalizeSymbol(symbol);
  return node.units.find((unit) => normalizeSymbol(unit.symbol) === key)?.dimensionSignature ?? null;
}

function scaleDomainStatus(from: TheoryBadgeV1, to: TheoryBadgeV1): TheoryMasterProblemEdgeV1["domainStatus"] {
  const left = from.scaleEnvelope;
  const right = to.scaleEnvelope;
  if (!left || !right) return "unknown";
  const leftMin = left.minLog10M ?? left.characteristicLog10M;
  const leftMax = left.maxLog10M ?? left.characteristicLog10M;
  const rightMin = right.minLog10M ?? right.characteristicLog10M;
  const rightMax = right.maxLog10M ?? right.characteristicLog10M;
  if ([leftMin, leftMax, rightMin, rightMax].some((value) => typeof value !== "number")) return "partial";
  return (leftMax as number) < (rightMin as number) || (rightMax as number) < (leftMin as number)
    ? "incompatible"
    : "compatible";
}

function buildEdges(args: {
  graph: TheoryBadgeGraphV1;
  badgesById: Map<string, TheoryBadgeV1>;
  nodesByBadge: Map<string, TheoryMasterProblemNodeV1[]>;
  selectedBadgeIds: Set<string>;
}): TheoryMasterProblemEdgeV1[] {
  return args.graph.edges
    .filter((edge) => args.selectedBadgeIds.has(edge.from) && args.selectedBadgeIds.has(edge.to))
    .flatMap((edge): TheoryMasterProblemEdgeV1[] => {
      const fromNode = primaryNode(args.nodesByBadge, edge.from);
      const toNode = primaryNode(args.nodesByBadge, edge.to);
      const fromBadge = args.badgesById.get(edge.from);
      const toBadge = args.badgesById.get(edge.to);
      if (!fromNode || !toNode || !fromBadge || !toBadge) return [];
      const toInputs = new Map(toNode.inputSymbols.map((symbol) => [normalizeSymbol(symbol), symbol]));
      const shared = fromNode.outputSymbols
        .map((fromSymbol) => ({ fromSymbol, toSymbol: toInputs.get(normalizeSymbol(fromSymbol)) }))
        .filter((entry): entry is { fromSymbol: string; toSymbol: string } => Boolean(entry.toSymbol));
      const symbolMap: TheoryMasterProblemEdgeV1["symbolMap"] = shared.length > 0
        ? shared.map(({ fromSymbol, toSymbol }) => ({ fromSymbol, toSymbol, status: "verified" }))
        : [{ fromSymbol: "*", toSymbol: "*", status: "missing" }];
      const comparedDimensions = shared.map(({ fromSymbol, toSymbol }) => ({
        from: dimensionFor(fromNode, fromSymbol),
        to: dimensionFor(toNode, toSymbol),
      }));
      const dimensionalStatus: TheoryMasterProblemEdgeV1["dimensionalStatus"] = shared.length === 0
        ? "unknown"
        : comparedDimensions.some((pair) => pair.from && pair.to && pair.from !== pair.to)
          ? "incompatible"
          : comparedDimensions.every((pair) => pair.from && pair.to)
            ? "compatible"
            : "partial";
      const domainStatus = scaleDomainStatus(fromBadge, toBadge);
      const verificationRequirements = unique([
        ...(shared.length === 0 ? ["bind equation output symbols to downstream input symbols"] : []),
        ...(dimensionalStatus === "partial" || dimensionalStatus === "unknown" ? ["complete unit dimension signatures"] : []),
        ...(dimensionalStatus === "incompatible" ? ["resolve dimensional incompatibility"] : []),
        ...(domainStatus === "partial" || domainStatus === "unknown" ? ["declare overlapping scale domain"] : []),
        ...(domainStatus === "incompatible" ? ["provide a justified cross-scale bridge"] : []),
        ...(edge.relation === "approximates" ? ["attach approximation regime and error bound"] : []),
      ]);
      return [{
        id: `theory-master-edge:${edge.id}`,
        sourceEdgeId: edge.id,
        fromNodeId: fromNode.id,
        toNodeId: toNode.id,
        operator: EDGE_OPERATOR[edge.relation],
        derivationClass: edge.relation === "approximates" ? "approximation" : "retrieved",
        symbolMap,
        dimensionalStatus,
        domainStatus,
        verificationRequirements,
        claimBoundaryNote: edge.claimBoundaryNote,
      }];
    });
}

function allowedResultKinds(
  operation: TheoryMasterProblemRequestV1["operation"],
  status: TheoryMasterProblemCompileStatusV1,
): TheoryMasterProblemResultKindV1[] {
  if (status === "dimensionally_incompatible" || status === "domain_mismatch") return ["contradiction", "unresolved"];
  if (status === "missing_bridge_relation" || status === "insufficient_evidence" || status === "unidentifiable") {
    return ["unresolved"];
  }
  if (status === "noncomputable") return ["symbolic_relation", "equivalence_class", "unresolved"];
  if (operation === "bound") return ["interval_bound", "asymptotic_result", "unresolved"];
  if (operation === "prove") return ["symbolic_relation", "counterexample", "contradiction", "unresolved"];
  if (operation === "compare") return ["probability_distribution", "interval_bound", "equivalence_class", "unresolved"];
  if (operation === "predict") return ["scalar_value", "probability_distribution", "interval_bound", "unresolved"];
  return ["scalar_value", "symbolic_relation", "interval_bound", "unresolved"];
}

export function compileTheoryMasterProblem(input: CompileTheoryMasterProblemInput): TheoryMasterProblemV1 {
  const badgesById = new Map(input.graph.badges.map((badge) => [badge.id, badge]));
  const selectedBadgeIds = unique(input.badgeIds).filter((badgeId) => badgesById.has(badgeId));
  const selectedSet = new Set(selectedBadgeIds);
  const badges = selectedBadgeIds.map((badgeId) => badgesById.get(badgeId)).filter((badge): badge is TheoryBadgeV1 => Boolean(badge));
  const nodes = buildNodes(badges);
  const nodesByBadge = new Map<string, TheoryMasterProblemNodeV1[]>();
  for (const node of nodes) nodesByBadge.set(node.badgeId, [...(nodesByBadge.get(node.badgeId) ?? []), node]);
  const edges = buildEdges({ graph: input.graph, badgesById, nodesByBadge, selectedBadgeIds: selectedSet });
  const outputSymbols = unique(nodes.flatMap((node) => node.outputSymbols));
  const inferredObservable = input.request.targetObservable ?? (outputSymbols.length === 1 ? outputSymbols[0] : null);
  const request: TheoryMasterProblemRequestV1 = { ...input.request, targetObservable: inferredObservable };
  const producedSymbolKeys = new Set(outputSymbols.map(normalizeSymbol));
  const missingBindings = unique(
    nodes.flatMap((node) => node.inputSymbols).filter((symbol) => !producedSymbolKeys.has(normalizeSymbol(symbol))),
  );
  const hardFailures = unique([
    ...edges.filter((edge) => edge.dimensionalStatus === "incompatible").map((edge) => `${edge.sourceEdgeId}: dimensional incompatibility`),
    ...edges.filter((edge) => edge.domainStatus === "incompatible").map((edge) => `${edge.sourceEdgeId}: scale-domain mismatch`),
  ]);
  const unresolvedReasons = unique([
    ...(selectedBadgeIds.length === 0 ? ["no supported graph badge was selected"] : []),
    ...(selectedBadgeIds.length > 1 && edges.length === 0 ? ["missing_bridge_relation"] : []),
    ...(missingBindings.length > 0 ? missingBindings.map((symbol) => `unbound input symbol: ${symbol}`) : []),
    ...(request.operation !== "explain" && !request.targetObservable ? ["target observable is not bound"] : []),
    ...edges.flatMap((edge) => edge.verificationRequirements.map((requirement) => `${edge.sourceEdgeId}: ${requirement}`)),
  ]);
  const allReferenceOnly = nodes.length > 0 && nodes.every((node) =>
    node.computabilityStatus === "noncomputable_reference" || node.kind === "boundary" || node.kind === "concept"
  );
  const hasExecutableNode = nodes.some((node) =>
    node.computabilityStatus === "closed_form" || node.computabilityStatus === "runtime_required"
  );
  let status: TheoryMasterProblemCompileStatusV1;
  if (selectedBadgeIds.length === 0 || (input.uncertainty?.outOfGraphProbability ?? 0) >= 0.75) {
    status = "insufficient_evidence";
  } else if (edges.some((edge) => edge.dimensionalStatus === "incompatible")) {
    status = "dimensionally_incompatible";
  } else if (edges.some((edge) => edge.domainStatus === "incompatible")) {
    status = "domain_mismatch";
  } else if (selectedBadgeIds.length > 1 && edges.length === 0) {
    status = "missing_bridge_relation";
  } else if (allReferenceOnly) {
    status = "noncomputable";
  } else if (request.operation !== "explain" && !request.targetObservable) {
    status = "unidentifiable";
  } else if (hardFailures.length === 0 && unresolvedReasons.length === 0 && hasExecutableNode) {
    status = "executable";
  } else {
    status = "partially_executable";
  }
  const runtimeAdmission = status === "executable" || status === "partially_executable"
    ? "eligible_for_completed_solver_path"
    : status === "noncomputable"
      ? "not_admitted"
      : "blocked";
  const hasProofObligation = request.operation === "prove" || nodes.some((node) => node.kind === "constraint" || node.kind === "gate");
  const formalStatus = nodes.some((node) => node.computabilityStatus === "noncomputable_reference")
    ? "noncomputable_reference_present" as const
    : hasProofObligation
      ? "proof_obligation_present" as const
      : "not_assessed" as const;

  return buildTheoryMasterProblemV1({
    generatedAt: input.generatedAt,
    planId: input.planId ?? `theory-master:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`,
    graphId: input.graph.graphId,
    request,
    selectedBadgeIds,
    nodes,
    edges,
    compile: {
      status,
      allowedResultKinds: allowedResultKinds(request.operation, status),
      missingBindings,
      unresolvedReasons,
      hardFailures,
      runtimeAdmission,
    },
    uncertaintyLedger: {
      placementEntropyBits: input.uncertainty?.placementEntropyBits ?? 0,
      openWorldEntropyBits: input.uncertainty?.openWorldEntropyBits ?? input.uncertainty?.placementEntropyBits ?? 0,
      outOfGraphProbability: input.uncertainty?.outOfGraphProbability ?? 0,
      modelUncertainty: "unquantified",
      parameterUncertainty: missingBindings.length > 0 ? "unquantified" : "not_applicable",
      processStochasticity: "unspecified",
      numericalUncertainty: "not_run",
      formalStatus,
    },
    claimBoundary: {
      validatesTheory: false,
      solvesPhysicalMechanism: false,
      promotionAllowed: false,
      assistantAnswer: false,
      terminalEligible: false,
      completedSolverPathRequired: true,
    },
  });
}
