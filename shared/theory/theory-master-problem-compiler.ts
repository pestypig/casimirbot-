import {
  buildTheoryMasterProblemV1,
  type TheoryMasterProblemBridgeOperatorV1,
  type TheoryMasterProblemCompileStatusV1,
  type TheoryMasterProblemEdgeV1,
  type TheoryMasterProblemNodeV1,
  type TheoryMasterProblemObservableBindingV1,
  type TheoryMasterProblemObservablePairCheckV1,
  type TheoryMasterProblemObservableResolutionV1,
  type TheoryMasterProblemRequestV1,
  type TheoryMasterProblemResultKindV1,
  type TheoryMasterProblemV1,
} from "../contracts/theory-master-problem.v1";
import type {
  TheoryBadgeEdgeRelation,
  TheoryBadgeEquationV1,
  TheoryBadgeGraphV1,
  TheoryBadgeObservableBridgeV1,
  TheoryBadgeObservableV1,
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
  comparisonBadgeIds?: string[];
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

function normalizeObservableKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function observableBinding(
  badgeId: string,
  observable: TheoryBadgeObservableV1,
): TheoryMasterProblemObservableBindingV1 {
  return {
    badgeId,
    observableId: observable.id,
    canonicalObservableId: observable.canonicalObservableId,
    symbol: observable.symbol,
    quantity: observable.quantity,
    mathematicalType: observable.mathematicalType,
    unit: observable.unit,
    dimensionSignature: observable.dimensionSignature,
    coordinateFrame: observable.coordinateFrame,
    operationalDefinitionRef: observable.operationalDefinitionRef,
    responseModelRef: observable.responseModelRef,
  };
}

function observableMatchesTarget(
  binding: TheoryMasterProblemObservableBindingV1,
  targetObservable: string,
): boolean {
  const target = normalizeObservableKey(targetObservable);
  return [
    binding.observableId,
    binding.canonicalObservableId,
    binding.symbol,
    binding.quantity,
  ].some((value) => normalizeObservableKey(value) === target);
}

function bridgeForPair(args: {
  graph: TheoryBadgeGraphV1;
  fromBadgeId: string;
  toBadgeId: string;
  fromObservable: TheoryMasterProblemObservableBindingV1;
  toObservable: TheoryMasterProblemObservableBindingV1;
}): { edgeId: string; bridge: TheoryBadgeObservableBridgeV1 } | null {
  for (const edge of args.graph.edges) {
    const bridge = edge.observableBridge;
    if (!bridge) continue;
    if (
      edge.from === args.fromBadgeId &&
      edge.to === args.toBadgeId &&
      bridge.fromObservableId === args.fromObservable.canonicalObservableId &&
      bridge.toObservableId === args.toObservable.canonicalObservableId
    ) {
      return { edgeId: edge.id, bridge };
    }
    if (
      bridge.reversible &&
      edge.from === args.toBadgeId &&
      edge.to === args.fromBadgeId &&
      bridge.fromObservableId === args.toObservable.canonicalObservableId &&
      bridge.toObservableId === args.fromObservable.canonicalObservableId
    ) {
      return { edgeId: edge.id, bridge };
    }
  }
  return null;
}

function bridgeDomainMismatch(
  bridge: TheoryBadgeObservableBridgeV1,
  request: TheoryMasterProblemRequestV1,
): string | null {
  if (
    request.coordinateFrame &&
    bridge.validityDomain.coordinateFrames.length > 0 &&
    !bridge.validityDomain.coordinateFrames.includes(request.coordinateFrame)
  ) {
    return `requested coordinate frame ${request.coordinateFrame} is outside the registered bridge domain`;
  }
  const requestedScale = request.scaleLog10M;
  const bridgeScale = bridge.validityDomain.scaleLog10M;
  if (requestedScale && bridgeScale) {
    if (
      typeof requestedScale.min === "number" &&
      typeof bridgeScale.min === "number" &&
      requestedScale.min < bridgeScale.min
    ) {
      return "requested minimum scale is outside the registered bridge domain";
    }
    if (
      typeof requestedScale.max === "number" &&
      typeof bridgeScale.max === "number" &&
      requestedScale.max > bridgeScale.max
    ) {
      return "requested maximum scale is outside the registered bridge domain";
    }
  }
  return null;
}

function bridgeErrorContractMissing(bridge: TheoryBadgeObservableBridgeV1): boolean {
  return ["calibrated_response", "coarse_graining", "approximation"].includes(bridge.kind) &&
    (bridge.errorContract.kind === "exact" || !bridge.errorContract.expression?.trim());
}

function pairCheckForBindings(args: {
  graph: TheoryBadgeGraphV1;
  request: TheoryMasterProblemRequestV1;
  fromBadgeId: string;
  toBadgeId: string;
  fromObservable: TheoryMasterProblemObservableBindingV1;
  toObservable: TheoryMasterProblemObservableBindingV1;
}): TheoryMasterProblemObservablePairCheckV1 {
  const base = {
    fromBadgeId: args.fromBadgeId,
    toBadgeId: args.toBadgeId,
    fromObservableId: args.fromObservable.observableId,
    toObservableId: args.toObservable.observableId,
    fromCanonicalObservableId: args.fromObservable.canonicalObservableId,
    toCanonicalObservableId: args.toObservable.canonicalObservableId,
  };
  const bridgeRecord = bridgeForPair(args);
  if (bridgeRecord) {
    const { bridge, edgeId } = bridgeRecord;
    if (
      ["identity", "unit_conversion", "coordinate_transform"].includes(bridge.kind) &&
      args.fromObservable.dimensionSignature &&
      args.toObservable.dimensionSignature &&
      args.fromObservable.dimensionSignature !== args.toObservable.dimensionSignature
    ) {
      return {
        ...base,
        status: "dimensional_mismatch",
        bridgeEdgeId: edgeId,
        bridgeKind: bridge.kind,
        errorKind: bridge.errorContract.kind,
        errorExpression: bridge.errorContract.expression,
        sourceRefs: bridge.sourceRefs,
        reason: "registered identity/unit/frame bridge has incompatible dimensions",
      };
    }
    if (bridgeErrorContractMissing(bridge)) {
      return {
        ...base,
        status: "bridge_error_contract_missing",
        bridgeEdgeId: edgeId,
        bridgeKind: bridge.kind,
        errorKind: bridge.errorContract.kind,
        errorExpression: bridge.errorContract.expression,
        sourceRefs: bridge.sourceRefs,
        reason: `${bridge.kind} bridge lacks a bounded or statistical error expression`,
      };
    }
    const domainMismatch = bridgeDomainMismatch(bridge, args.request);
    if (domainMismatch) {
      return {
        ...base,
        status: "bridge_domain_mismatch",
        bridgeEdgeId: edgeId,
        bridgeKind: bridge.kind,
        errorKind: bridge.errorContract.kind,
        errorExpression: bridge.errorContract.expression,
        sourceRefs: bridge.sourceRefs,
        reason: domainMismatch,
      };
    }
    return {
      ...base,
      status: "approved_bridge",
      bridgeEdgeId: edgeId,
      bridgeKind: bridge.kind,
      errorKind: bridge.errorContract.kind,
      errorExpression: bridge.errorContract.expression,
      sourceRefs: bridge.sourceRefs,
      reason: `registered ${bridge.kind} bridge admits the observable comparison`,
    };
  }

  if (args.fromObservable.canonicalObservableId !== args.toObservable.canonicalObservableId) {
    return {
      ...base,
      status: "observable_identity_mismatch",
      bridgeEdgeId: null,
      bridgeKind: null,
      errorKind: null,
      errorExpression: null,
      sourceRefs: [],
      reason: "canonical observable identities differ and no registered bridge connects them",
    };
  }
  if (args.fromObservable.mathematicalType !== args.toObservable.mathematicalType) {
    return {
      ...base,
      status: "mathematical_type_mismatch",
      bridgeEdgeId: null,
      bridgeKind: null,
      errorKind: null,
      errorExpression: null,
      sourceRefs: [],
      reason: "canonical observable identity is shared but mathematical object types differ",
    };
  }
  if (
    args.fromObservable.dimensionSignature &&
    args.toObservable.dimensionSignature &&
    args.fromObservable.dimensionSignature !== args.toObservable.dimensionSignature
  ) {
    return {
      ...base,
      status: "dimensional_mismatch",
      bridgeEdgeId: null,
      bridgeKind: null,
      errorKind: null,
      errorExpression: null,
      sourceRefs: [],
      reason: "canonical observable identity is shared but dimension signatures differ",
    };
  }
  if (
    args.fromObservable.unit &&
    args.toObservable.unit &&
    args.fromObservable.unit !== args.toObservable.unit
  ) {
    return {
      ...base,
      status: "observable_identity_mismatch",
      bridgeEdgeId: null,
      bridgeKind: null,
      errorKind: null,
      errorExpression: null,
      sourceRefs: [],
      reason: "same observable is reported in different units without a registered unit-conversion bridge",
    };
  }
  if (
    args.fromObservable.coordinateFrame &&
    args.toObservable.coordinateFrame &&
    args.fromObservable.coordinateFrame !== args.toObservable.coordinateFrame
  ) {
    return {
      ...base,
      status: "coordinate_frame_mismatch",
      bridgeEdgeId: null,
      bridgeKind: null,
      errorKind: null,
      errorExpression: null,
      sourceRefs: [],
      reason: "same observable is bound to different frames without a registered coordinate transform",
    };
  }
  if (
    args.fromObservable.responseModelRef &&
    args.toObservable.responseModelRef &&
    args.fromObservable.responseModelRef !== args.toObservable.responseModelRef
  ) {
    return {
      ...base,
      status: "observable_identity_mismatch",
      bridgeEdgeId: null,
      bridgeKind: null,
      errorKind: null,
      errorExpression: null,
      sourceRefs: [],
      reason: "instrument/response models differ without a registered calibrated-response bridge",
    };
  }
  return {
    ...base,
    status: "same_canonical_observable",
    bridgeEdgeId: null,
    bridgeKind: null,
    errorKind: "exact",
    errorExpression: null,
    sourceRefs: unique([
      args.fromObservable.operationalDefinitionRef,
      args.toObservable.operationalDefinitionRef,
    ]),
    reason: "source-backed bindings share canonical observable identity, type, dimension, unit, and frame",
  };
}

const PAIR_CHECK_RANK: Record<TheoryMasterProblemObservablePairCheckV1["status"], number> = {
  same_canonical_observable: 100,
  approved_bridge: 90,
  bridge_domain_mismatch: 40,
  bridge_error_contract_missing: 35,
  coordinate_frame_mismatch: 30,
  mathematical_type_mismatch: 25,
  dimensional_mismatch: 20,
  observable_identity_mismatch: 10,
  missing_observable_binding: 0,
};

function buildObservableResolution(args: {
  graph: TheoryBadgeGraphV1;
  badgesById: Map<string, TheoryBadgeV1>;
  selectedBadgeIds: string[];
  comparisonBadgeIds?: string[];
  request: TheoryMasterProblemRequestV1;
}): TheoryMasterProblemObservableResolutionV1 {
  const allBindings = args.selectedBadgeIds.flatMap((badgeId) =>
    (args.badgesById.get(badgeId)?.observables ?? []).map((observable) => observableBinding(badgeId, observable)),
  );
  if (args.request.operation !== "compare") {
    return {
      targetObservableId: args.request.targetObservable,
      status: "not_required",
      participantBadgeIds: [],
      bindings: allBindings,
      pairChecks: [],
      unresolvedReasons: [],
    };
  }

  const explicitParticipants = unique(args.comparisonBadgeIds ?? [])
    .filter((badgeId) => args.selectedBadgeIds.includes(badgeId));
  const participantBadgeIds = explicitParticipants.length > 0
    ? explicitParticipants
    : args.selectedBadgeIds.filter((badgeId) =>
        (args.badgesById.get(badgeId)?.observables?.length ?? 0) > 0,
      );
  const directTargetBindings = args.request.targetObservable
    ? allBindings.filter((binding) => observableMatchesTarget(binding, args.request.targetObservable as string))
    : [];
  const candidateBindings = directTargetBindings.length > 0
    ? allBindings.filter((binding) =>
        directTargetBindings.some((target) =>
          target.badgeId === binding.badgeId ||
          target.canonicalObservableId === binding.canonicalObservableId ||
          bridgeForPair({
            graph: args.graph,
            fromBadgeId: target.badgeId,
            toBadgeId: binding.badgeId,
            fromObservable: target,
            toObservable: binding,
          }) !== null ||
          bridgeForPair({
            graph: args.graph,
            fromBadgeId: binding.badgeId,
            toBadgeId: target.badgeId,
            fromObservable: binding,
            toObservable: target,
          }) !== null,
        ),
      )
    : allBindings;

  const pairChecks: TheoryMasterProblemObservablePairCheckV1[] = [];
  for (let leftIndex = 0; leftIndex < participantBadgeIds.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < participantBadgeIds.length; rightIndex += 1) {
      const fromBadgeId = participantBadgeIds[leftIndex];
      const toBadgeId = participantBadgeIds[rightIndex];
      const fromBindings = candidateBindings.filter((binding) => binding.badgeId === fromBadgeId);
      const toBindings = candidateBindings.filter((binding) => binding.badgeId === toBadgeId);
      if (fromBindings.length === 0 || toBindings.length === 0) {
        pairChecks.push({
          fromBadgeId,
          toBadgeId,
          fromObservableId: fromBindings[0]?.observableId ?? null,
          toObservableId: toBindings[0]?.observableId ?? null,
          fromCanonicalObservableId: fromBindings[0]?.canonicalObservableId ?? null,
          toCanonicalObservableId: toBindings[0]?.canonicalObservableId ?? null,
          status: "missing_observable_binding",
          bridgeEdgeId: null,
          bridgeKind: null,
          errorKind: null,
          errorExpression: null,
          sourceRefs: [],
          reason: "comparison participant lacks a source-backed observable binding for the requested target",
        });
        continue;
      }
      const ranked = fromBindings.flatMap((fromObservable) =>
        toBindings.map((toObservable) => pairCheckForBindings({
          graph: args.graph,
          request: args.request,
          fromBadgeId,
          toBadgeId,
          fromObservable,
          toObservable,
        })),
      ).sort((left, right) => PAIR_CHECK_RANK[right.status] - PAIR_CHECK_RANK[left.status]);
      pairChecks.push(ranked[0]);
    }
  }

  const unresolvedReasons = unique([
    ...(participantBadgeIds.length < 2
      ? ["observable comparison requires at least two source-backed participant badges"]
      : []),
    ...(args.request.targetObservable && directTargetBindings.length === 0
      ? [`target observable is not registered: ${args.request.targetObservable}`]
      : []),
    ...pairChecks
      .filter((check) => check.status !== "same_canonical_observable" && check.status !== "approved_bridge")
      .map((check) => `${check.fromBadgeId} -> ${check.toBadgeId}: ${check.reason}`),
  ]);
  const directlySharedCanonicalIds = unique(
    pairChecks
      .filter((check) => check.status === "same_canonical_observable")
      .map((check) => check.fromCanonicalObservableId ?? ""),
  );
  const inferredTargetObservable =
    !args.request.targetObservable &&
    pairChecks.length > 0 &&
    pairChecks.every((check) => check.status === "same_canonical_observable") &&
    directlySharedCanonicalIds.length === 1
      ? directlySharedCanonicalIds[0]
      : null;
  return {
    targetObservableId: args.request.targetObservable ?? inferredTargetObservable,
    status: unresolvedReasons.length === 0 && pairChecks.length > 0 ? "resolved" : "blocked",
    participantBadgeIds,
    bindings: allBindings,
    pairChecks,
    unresolvedReasons,
  };
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
  let request: TheoryMasterProblemRequestV1 = { ...input.request, targetObservable: inferredObservable };
  const observableResolution = buildObservableResolution({
    graph: input.graph,
    badgesById,
    selectedBadgeIds,
    comparisonBadgeIds: input.comparisonBadgeIds,
    request,
  });
  if (!request.targetObservable && observableResolution.targetObservableId) {
    request = { ...request, targetObservable: observableResolution.targetObservableId };
  }
  const producedSymbolKeys = new Set(outputSymbols.map(normalizeSymbol));
  const missingBindings = unique(
    nodes.flatMap((node) => node.inputSymbols).filter((symbol) => !producedSymbolKeys.has(normalizeSymbol(symbol))),
  );
  const hardFailures = unique([
    ...edges.filter((edge) => edge.dimensionalStatus === "incompatible").map((edge) => `${edge.sourceEdgeId}: dimensional incompatibility`),
    ...edges.filter((edge) => edge.domainStatus === "incompatible").map((edge) => `${edge.sourceEdgeId}: scale-domain mismatch`),
    ...observableResolution.pairChecks
      .filter((check) => check.status === "dimensional_mismatch" || check.status === "mathematical_type_mismatch")
      .map((check) => `${check.fromBadgeId} -> ${check.toBadgeId}: ${check.reason}`),
    ...observableResolution.pairChecks
      .filter((check) => check.status === "coordinate_frame_mismatch" || check.status === "bridge_domain_mismatch")
      .map((check) => `${check.fromBadgeId} -> ${check.toBadgeId}: ${check.reason}`),
  ]);
  const unresolvedReasons = unique([
    ...(selectedBadgeIds.length === 0 ? ["no supported graph badge was selected"] : []),
    ...(selectedBadgeIds.length > 1 &&
      edges.length === 0 &&
      !(request.operation === "compare" && observableResolution.status === "resolved")
      ? ["missing_bridge_relation"]
      : []),
    ...(missingBindings.length > 0 ? missingBindings.map((symbol) => `unbound input symbol: ${symbol}`) : []),
    ...(request.operation !== "explain" && !request.targetObservable ? ["target observable is not bound"] : []),
    ...observableResolution.unresolvedReasons,
    ...edges.flatMap((edge) => edge.verificationRequirements.map((requirement) => `${edge.sourceEdgeId}: ${requirement}`)),
  ]);
  const allReferenceOnly = nodes.length > 0 && nodes.every((node) =>
    node.computabilityStatus === "noncomputable_reference" || node.kind === "boundary" || node.kind === "concept"
  );
  const hasExecutableNode = nodes.some((node) =>
    node.computabilityStatus === "closed_form" || node.computabilityStatus === "runtime_required"
  );
  const observableStatuses = new Set(observableResolution.pairChecks.map((check) => check.status));
  const observableCompileFailure: TheoryMasterProblemCompileStatusV1 | null = observableResolution.status !== "blocked"
    ? null
    : observableStatuses.has("dimensional_mismatch") || observableStatuses.has("mathematical_type_mismatch")
      ? "dimensionally_incompatible"
      : observableStatuses.has("coordinate_frame_mismatch") || observableStatuses.has("bridge_domain_mismatch")
        ? "domain_mismatch"
        : observableStatuses.has("missing_observable_binding") || observableResolution.pairChecks.length === 0
          ? "unidentifiable"
          : "missing_bridge_relation";
  let status: TheoryMasterProblemCompileStatusV1;
  if (selectedBadgeIds.length === 0 || (input.uncertainty?.outOfGraphProbability ?? 0) >= 0.75) {
    status = "insufficient_evidence";
  } else if (observableCompileFailure) {
    status = observableCompileFailure;
  } else if (edges.some((edge) => edge.dimensionalStatus === "incompatible")) {
    status = "dimensionally_incompatible";
  } else if (edges.some((edge) => edge.domainStatus === "incompatible")) {
    status = "domain_mismatch";
  } else if (
    selectedBadgeIds.length > 1 &&
    edges.length === 0 &&
    !(request.operation === "compare" && observableResolution.status === "resolved")
  ) {
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
    observableResolution,
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
