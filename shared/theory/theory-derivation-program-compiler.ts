import {
  buildTheoryDerivationProgramV1,
  type TheoryDerivationFailureCodeV1,
  type TheoryDerivationFailureReceiptV1,
  type TheoryDerivationFailureStageV1,
  type TheoryDerivationObligationKindV1,
  type TheoryDerivationObligationV1,
  type TheoryDerivationProgramStatusV1,
  type TheoryDerivationProgramStepV1,
  type TheoryDerivationProgramV1,
  type TheoryDerivationRouteAdmissionV1,
  type TheoryDerivationSolverFamilyV1,
  type TheoryDerivationStepAdmissionV1,
  type TheoryDerivationStepKindV1,
} from "../contracts/theory-derivation-program.v1";
import type {
  TheoryMasterProblemNodeV1,
  TheoryMasterProblemObservableBindingV1,
  TheoryMasterProblemObservablePairCheckV1,
  TheoryMasterProblemV1,
} from "../contracts/theory-master-problem.v1";

export type CompileTheoryDerivationProgramInput = {
  masterProblem: TheoryMasterProblemV1;
  generatedAt?: string;
};

type StepDraft = Omit<TheoryDerivationProgramStepV1, "ordinal">;

const HARD_BLOCKED_MASTER_STATUSES = new Set([
  "insufficient_evidence",
  "unidentifiable",
  "missing_bridge_relation",
  "dimensionally_incompatible",
  "domain_mismatch",
]);

function unique(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function nodeStepKind(node: TheoryMasterProblemNodeV1): TheoryDerivationStepKindV1 {
  if (node.computabilityStatus === "runtime_required") return "request_runtime_observation";
  if (node.computabilityStatus === "gate_required") return "evaluate_gate";
  if (node.computabilityStatus === "noncomputable_reference") return "preserve_symbolic_reference";
  if (node.computabilityStatus === "closed_form") return "evaluate_relation";
  return "retrieve_relation";
}

function nodeAdmission(
  node: TheoryMasterProblemNodeV1,
  admission: TheoryDerivationStepAdmissionV1,
): TheoryDerivationStepAdmissionV1 {
  return node.computabilityStatus === "noncomputable_reference" ? "reference_only" : admission;
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function selectedProgramNodeIds(master: TheoryMasterProblemV1): Set<string> {
  if (master.request.operation === "explain" || master.nodes.length === 0) {
    return new Set(master.nodes.map((node) => node.id));
  }
  const targets = new Set<string>();
  if (master.request.operation === "compare") {
    const participantBadges = new Set(master.observableResolution.participantBadgeIds);
    const participantBindings = master.observableResolution.bindings.filter((binding) =>
      participantBadges.has(binding.badgeId)
    );
    participantBindings.forEach((binding) => {
      const matched = master.nodes.filter((node) =>
        node.badgeId === binding.badgeId &&
        node.outputSymbols.some((symbol) => normalizeKey(symbol) === normalizeKey(binding.symbol))
      );
      if (matched.length > 0) matched.forEach((node) => targets.add(node.id));
      else {
        const primary = primaryNodeForBadge(master, binding.badgeId);
        if (primary) targets.add(primary.id);
      }
    });
    participantBadges.forEach((badgeId) => {
      if (Array.from(targets).some((nodeId) => master.nodes.find((node) => node.id === nodeId)?.badgeId === badgeId)) return;
      const primary = primaryNodeForBadge(master, badgeId);
      if (primary) targets.add(primary.id);
    });
  } else if (master.request.targetObservable) {
    const target = normalizeKey(master.request.targetObservable);
    master.nodes.forEach((node) => {
      if (node.outputSymbols.some((symbol) => normalizeKey(symbol) === target)) targets.add(node.id);
    });
    master.observableResolution.bindings
      .filter((binding) => [
        binding.observableId,
        binding.canonicalObservableId,
        binding.symbol,
        binding.quantity,
      ].some((value) => normalizeKey(value) === target))
      .forEach((binding) => {
        const primary = primaryNodeForBadge(master, binding.badgeId);
        if (primary) targets.add(primary.id);
      });
  }
  if (targets.size === 0) return new Set(master.nodes.map((node) => node.id));

  const incoming = new Map<string, string[]>();
  master.edges.forEach((edge) => {
    incoming.set(edge.toNodeId, [...(incoming.get(edge.toNodeId) ?? []), edge.fromNodeId]);
  });
  const selected = new Set(targets);
  const queue = Array.from(targets);
  while (queue.length > 0) {
    const nodeId = queue.shift() as string;
    for (const upstream of incoming.get(nodeId) ?? []) {
      if (selected.has(upstream)) continue;
      selected.add(upstream);
      queue.push(upstream);
    }
  }
  return selected;
}

function relevantMasterParts(master: TheoryMasterProblemV1): {
  nodes: TheoryMasterProblemNodeV1[];
  edges: TheoryMasterProblemV1["edges"];
  missingBindings: string[];
} {
  const nodeIds = selectedProgramNodeIds(master);
  const nodes = master.nodes.filter((node) => nodeIds.has(node.id));
  const edges = master.edges.filter((edge) => nodeIds.has(edge.fromNodeId) && nodeIds.has(edge.toNodeId));
  const produced = new Set(nodes.flatMap((node) => node.outputSymbols).map(normalizeKey));
  const relevantMissing = new Set(
    nodes.flatMap((node) => node.inputSymbols).filter((symbol) => !produced.has(normalizeKey(symbol))),
  );
  return {
    nodes,
    edges,
    missingBindings: master.compile.missingBindings.filter((symbol) => relevantMissing.has(symbol)),
  };
}

function buildObligations(master: TheoryMasterProblemV1): TheoryDerivationObligationV1[] {
  const obligations: TheoryDerivationObligationV1[] = [];
  const masterHardBlocked = HARD_BLOCKED_MASTER_STATUSES.has(master.compile.status);
  const relevant = relevantMasterParts(master);
  const add = (args: Omit<TheoryDerivationObligationV1, "id">): void => {
    obligations.push({
      id: `derivation-obligation:${master.planId}:${obligations.length + 1}`,
      ...args,
    });
  };

  add({
    kind: "evidence_coverage",
    phase: "preflight",
    status: master.compile.status === "insufficient_evidence" ? "blocked" : "satisfied",
    description: master.compile.status === "insufficient_evidence"
      ? "Represented graph evidence is insufficient for this request."
      : "The Master Problem has represented graph evidence below the open-world block threshold.",
    relatedIds: master.selectedBadgeIds,
    sourceRefs: unique(master.nodes.flatMap((node) => node.sourceRefs)),
    repair: master.compile.status === "insufficient_evidence"
      ? "Retrieve or register source-backed badges for the requested subject before compiling a solver route."
      : null,
  });

  const targetRequired = master.request.operation !== "explain";
  add({
    kind: "target_observable",
    phase: "preflight",
    status: !targetRequired
      ? "not_applicable"
      : master.request.targetObservable
        ? "satisfied"
        : master.compile.status === "unidentifiable"
          ? "blocked"
          : "required",
    description: !targetRequired
      ? "An explanatory route does not require a numeric target observable."
      : master.request.targetObservable
        ? `Target observable is bound as ${master.request.targetObservable}.`
        : "The request does not identify a target observable.",
    relatedIds: master.request.targetObservable ? [master.request.targetObservable] : [],
    sourceRefs: [],
    repair: targetRequired && !master.request.targetObservable
      ? "Bind the request to a registered canonical observable."
      : null,
  });

  if (!masterHardBlocked) {
    relevant.missingBindings.forEach((symbol) => add({
      kind: "input_binding",
      phase: "preflight",
      status: "required",
      description: `Input symbol ${symbol} has no supplied or upstream binding.`,
      relatedIds: [symbol],
      sourceRefs: [],
      repair: `Supply ${symbol} through the request boundary conditions or a registered upstream relation.`,
    }));
  }

  if (!masterHardBlocked) relevant.edges.forEach((edge) => {
    add({
      kind: "dimensional_consistency",
      phase: "preflight",
      status: edge.dimensionalStatus === "compatible"
        ? "satisfied"
        : edge.dimensionalStatus === "incompatible"
          ? "blocked"
          : "required",
      description: `Graph edge ${edge.sourceEdgeId} has dimensional status ${edge.dimensionalStatus}.`,
      relatedIds: [edge.id, edge.sourceEdgeId],
      sourceRefs: [],
      repair: edge.dimensionalStatus === "compatible"
        ? null
        : "Complete symbol dimensions or register a dimensionally valid transformation.",
    });
    add({
      kind: "scale_domain",
      phase: "preflight",
      status: edge.domainStatus === "compatible"
        ? "satisfied"
        : edge.domainStatus === "incompatible"
          ? "blocked"
          : "required",
      description: `Graph edge ${edge.sourceEdgeId} has scale-domain status ${edge.domainStatus}.`,
      relatedIds: [edge.id, edge.sourceEdgeId],
      sourceRefs: [],
      repair: edge.domainStatus === "compatible"
        ? null
        : "Declare an overlapping validity domain or register a justified cross-scale bridge.",
    });
  });

  master.observableResolution.pairChecks.forEach((pair, index) => {
    const relatedIds = unique([
      pair.fromBadgeId,
      pair.toBadgeId,
      pair.fromObservableId,
      pair.toObservableId,
      pair.bridgeEdgeId,
    ]);
    if (pair.status === "same_canonical_observable") {
      add({
        kind: "observable_identity",
        phase: "preflight",
        status: "satisfied",
        description: pair.reason,
        relatedIds,
        sourceRefs: pair.sourceRefs,
        repair: null,
      });
      return;
    }
    if (pair.status === "approved_bridge") {
      add({
        kind: "bridge_registration",
        phase: "preflight",
        status: "satisfied",
        description: pair.reason,
        relatedIds,
        sourceRefs: pair.sourceRefs,
        repair: null,
      });
      add({
        kind: "bridge_domain",
        phase: "preflight",
        status: "satisfied",
        description: `Registered bridge ${pair.bridgeEdgeId ?? index} is valid in the requested domain.`,
        relatedIds,
        sourceRefs: pair.sourceRefs,
        repair: null,
      });
      if (pair.errorKind === "bounded" || pair.errorKind === "statistical") {
        add({
          kind: "bridge_error_contract",
          phase: "preflight",
          status: "satisfied",
          description: `Bridge error is declared as ${pair.errorKind}: ${pair.errorExpression}.`,
          relatedIds,
          sourceRefs: pair.sourceRefs,
          repair: null,
        });
        add({
          kind: "uncertainty_propagation",
          phase: "execution",
          status: "required",
          description: "The completed solver path must propagate the registered bridge error into its result.",
          relatedIds,
          sourceRefs: pair.sourceRefs,
          repair: "Execute an uncertainty-aware comparison and retain the propagated interval or distribution receipt.",
        });
      }
      return;
    }

    const kind: TheoryDerivationObligationKindV1 = pair.status === "missing_observable_binding"
      ? "observable_identity"
      : pair.status === "observable_identity_mismatch"
        ? "bridge_registration"
        : pair.status === "mathematical_type_mismatch" || pair.status === "dimensional_mismatch"
          ? "dimensional_consistency"
          : pair.status === "coordinate_frame_mismatch" || pair.status === "bridge_domain_mismatch"
            ? "bridge_domain"
            : "bridge_error_contract";
    add({
      kind,
      phase: "preflight",
      status: "blocked",
      description: pair.reason,
      relatedIds,
      sourceRefs: pair.sourceRefs,
      repair: pair.status === "missing_observable_binding"
        ? "Register source-backed observable metadata for every comparison participant."
        : pair.status === "observable_identity_mismatch"
          ? "Register and review a provenance-backed observable bridge."
          : pair.status === "bridge_error_contract_missing"
            ? "Add a bounded or statistical bridge error expression."
            : "Repair the observable type, dimension, frame, or validity-domain mismatch.",
    });
  });

  if (!masterHardBlocked) relevant.nodes.forEach((node) => {
    if (node.computabilityStatus === "runtime_required") {
      add({
        kind: "runtime_receipt",
        phase: "post_execution",
        status: "required",
        description: `${node.id} requires a registered runtime observation receipt.`,
        relatedIds: [node.id, node.badgeId],
        sourceRefs: node.sourceRefs,
        repair: "Run the admitted runtime through the agent-owned capability lane and re-enter its receipt.",
      });
    }
    if (node.computabilityStatus === "gate_required") {
      add({
        kind: "gate_receipt",
        phase: "post_execution",
        status: "required",
        description: `${node.id} requires a gate observation receipt.`,
        relatedIds: [node.id, node.badgeId],
        sourceRefs: node.sourceRefs,
        repair: "Evaluate the registered gate and re-enter its typed receipt before synthesis.",
      });
    }
  });

  if (master.request.operation === "prove") {
    add({
      kind: "formal_system",
      phase: "preflight",
      status: master.request.formalSystem ? "satisfied" : "required",
      description: master.request.formalSystem
        ? `Proof obligations are scoped to ${master.request.formalSystem}.`
        : "No formal system is declared for the proof request.",
      relatedIds: master.request.formalSystem ? [master.request.formalSystem] : [],
      sourceRefs: [],
      repair: master.request.formalSystem ? null : "Declare the formal system and admissible proof rules.",
    });
  }
  return obligations;
}

function failureForMasterStatus(master: TheoryMasterProblemV1): Omit<TheoryDerivationFailureReceiptV1, "id"> | null {
  const common = {
    relatedIds: master.selectedBadgeIds,
    sourceRefs: unique(master.nodes.flatMap((node) => node.sourceRefs)),
    assistantAnswer: false as const,
    terminalEligible: false as const,
  };
  switch (master.compile.status) {
    case "insufficient_evidence":
      return {
        ...common,
        code: "insufficient_evidence",
        stage: "master_problem_admission",
        message: "The represented graph evidence does not admit a derivation program.",
        retryable: true,
        repair: "Retrieve or register source-backed evidence, then compile a new Master Problem.",
      };
    case "unidentifiable":
      return {
        ...common,
        code: master.request.operation === "compare" ? "observable_unidentifiable" : "target_unidentifiable",
        stage: master.request.operation === "compare" ? "observable_resolution" : "master_problem_admission",
        message: master.compile.unresolvedReasons[0] ?? "The requested target cannot be identified.",
        retryable: true,
        repair: master.request.operation === "compare"
          ? "Register source-backed canonical observable bindings for every participant."
          : "Bind the request to a registered target observable.",
      };
    case "missing_bridge_relation":
      return {
        ...common,
        code: "missing_bridge_relation",
        stage: master.request.operation === "compare" ? "observable_resolution" : "dependency_analysis",
        message: master.compile.unresolvedReasons[0] ?? "No registered bridge connects the selected evidence.",
        retryable: true,
        repair: "Register and review a provenance-backed relation or observable transformation before recompiling.",
      };
    case "dimensionally_incompatible":
      return {
        ...common,
        code: "dimensionally_incompatible",
        stage: "master_problem_admission",
        message: master.compile.hardFailures[0] ?? "Selected relations are dimensionally incompatible.",
        retryable: false,
        repair: "Correct the symbol dimensions or replace the incompatible path with a registered valid relation.",
      };
    case "domain_mismatch":
      return {
        ...common,
        code: "domain_mismatch",
        stage: "master_problem_admission",
        message: master.compile.hardFailures[0] ?? "Selected relations are outside their declared validity domain.",
        retryable: true,
        repair: "Narrow the request domain or register a transformation valid at the requested scale and frame.",
      };
    case "noncomputable":
      return {
        ...common,
        code: "noncomputable_reference",
        stage: "solver_route_admission",
        message: "The selected material is representable as a symbolic/formal reference but is not executable.",
        retryable: false,
        repair: "Report the formal limitation or choose a computable surrogate with an explicit claim boundary.",
      };
    default:
      return null;
  }
}

function buildFailureReceipts(master: TheoryMasterProblemV1): TheoryDerivationFailureReceiptV1[] {
  const receipts: TheoryDerivationFailureReceiptV1[] = [];
  const relevant = relevantMasterParts(master);
  const add = (receipt: Omit<TheoryDerivationFailureReceiptV1, "id">): void => {
    receipts.push({ id: `derivation-failure:${master.planId}:${receipts.length + 1}`, ...receipt });
  };
  const masterFailure = failureForMasterStatus(master);
  if (masterFailure) add(masterFailure);
  if (!HARD_BLOCKED_MASTER_STATUSES.has(master.compile.status)) {
    relevant.missingBindings.forEach((symbol) => add({
      code: "input_binding_missing",
      stage: "master_problem_admission",
      message: `Input symbol ${symbol} is unbound.`,
      relatedIds: [symbol],
      sourceRefs: [],
      retryable: true,
      repair: `Supply ${symbol} or register an upstream relation that produces it.`,
      assistantAnswer: false,
      terminalEligible: false,
    }));
  }
  if (
    master.request.operation !== "explain" &&
    !master.request.targetObservable &&
    !receipts.some((receipt) => receipt.code === "target_unidentifiable" || receipt.code === "observable_unidentifiable")
  ) {
    add({
      code: "target_unidentifiable",
      stage: "master_problem_admission",
      message: "The derivation target observable is not bound.",
      relatedIds: [],
      sourceRefs: [],
      retryable: true,
      repair: "Bind the request to a registered target observable.",
      assistantAnswer: false,
      terminalEligible: false,
    });
  }
  return receipts;
}

function primaryNodeForBadge(master: TheoryMasterProblemV1, badgeId: string): TheoryMasterProblemNodeV1 | null {
  const nodes = master.nodes.filter((node) => node.badgeId === badgeId);
  return nodes.find((node) => node.outputSymbols.length > 0) ?? nodes[0] ?? null;
}

function bindingForPair(
  master: TheoryMasterProblemV1,
  badgeId: string,
  observableId: string | null,
): TheoryMasterProblemObservableBindingV1 | null {
  return master.observableResolution.bindings.find((binding) =>
    binding.badgeId === badgeId && (!observableId || binding.observableId === observableId)
  ) ?? null;
}

function buildExecutableSteps(
  master: TheoryMasterProblemV1,
  admission: TheoryDerivationStepAdmissionV1,
): StepDraft[] {
  const steps: StepDraft[] = [];
  const nodeStepById = new Map<string, StepDraft>();
  const relevant = relevantMasterParts(master);
  relevant.nodes.forEach((node) => {
    const step: StepDraft = {
      id: `derivation-step:node:${node.id}`,
      kind: nodeStepKind(node),
      label: node.computabilityStatus === "runtime_required"
        ? `Request runtime observation for ${node.title}`
        : node.computabilityStatus === "gate_required"
          ? `Evaluate registered gate for ${node.title}`
          : node.computabilityStatus === "noncomputable_reference"
            ? `Preserve formal reference ${node.title}`
            : node.computabilityStatus === "closed_form"
              ? `Evaluate ${node.title}`
              : `Retrieve ${node.title}`,
      dependsOnStepIds: [],
      sourceNodeIds: [node.id],
      sourceEdgeIds: [],
      inputSymbols: node.inputSymbols,
      outputSymbols: node.outputSymbols,
      expression: node.expression,
      assumptions: node.assumptions,
      sourceRefs: node.sourceRefs,
      admission: nodeAdmission(node, admission),
      executionStatus: "not_started",
    };
    steps.push(step);
    nodeStepById.set(node.id, step);
  });

  relevant.edges.forEach((edge) => {
    const sourceStep = nodeStepById.get(edge.fromNodeId);
    const targetStep = nodeStepById.get(edge.toNodeId);
    if (!sourceStep || !targetStep) return;
    const relationStep: StepDraft = {
      id: `derivation-step:edge:${edge.id}`,
      kind: "apply_graph_relation",
      label: `Apply registered ${edge.operator} relation ${edge.sourceEdgeId}`,
      dependsOnStepIds: [sourceStep.id],
      sourceNodeIds: [edge.fromNodeId, edge.toNodeId],
      sourceEdgeIds: [edge.sourceEdgeId],
      inputSymbols: unique(edge.symbolMap.map((mapping) => mapping.fromSymbol)),
      outputSymbols: unique(edge.symbolMap.map((mapping) => mapping.toSymbol)),
      expression: null,
      assumptions: edge.verificationRequirements,
      sourceRefs: [],
      admission,
      executionStatus: "not_started",
    };
    steps.push(relationStep);
    targetStep.dependsOnStepIds = unique([...targetStep.dependsOnStepIds, relationStep.id]);
  });

  const bindingStepByKey = new Map<string, StepDraft>();
  const ensureBindingStep = (
    binding: TheoryMasterProblemObservableBindingV1,
  ): StepDraft => {
    const key = `${binding.badgeId}:${binding.observableId}`;
    const existing = bindingStepByKey.get(key);
    if (existing) return existing;
    const sourceNode = primaryNodeForBadge(master, binding.badgeId);
    const sourceStep = sourceNode ? nodeStepById.get(sourceNode.id) : null;
    const step: StepDraft = {
      id: `derivation-step:observable:${key}`,
      kind: "bind_observable",
      label: `Bind ${binding.canonicalObservableId} from ${binding.badgeId}`,
      dependsOnStepIds: sourceStep ? [sourceStep.id] : [],
      sourceNodeIds: sourceNode ? [sourceNode.id] : [],
      sourceEdgeIds: [],
      inputSymbols: [],
      outputSymbols: [binding.symbol],
      expression: null,
      assumptions: unique([binding.operationalDefinitionRef, binding.responseModelRef]),
      sourceRefs: unique([binding.operationalDefinitionRef, binding.responseModelRef]),
      admission,
      executionStatus: "not_started",
    };
    steps.push(step);
    bindingStepByKey.set(key, step);
    return step;
  };

  master.observableResolution.pairChecks
    .filter((pair) => pair.status === "same_canonical_observable" || pair.status === "approved_bridge")
    .forEach((pair, index) => {
      const fromBinding = bindingForPair(master, pair.fromBadgeId, pair.fromObservableId);
      const toBinding = bindingForPair(master, pair.toBadgeId, pair.toObservableId);
      if (!fromBinding || !toBinding) return;
      const fromStep = ensureBindingStep(fromBinding);
      const toStep = ensureBindingStep(toBinding);
      let transformedStep: StepDraft | null = null;
      if (pair.status === "approved_bridge") {
        transformedStep = {
          id: `derivation-step:observable-bridge:${index + 1}:${pair.bridgeEdgeId ?? "registered"}`,
          kind: "apply_registered_bridge",
          label: `Apply registered ${pair.bridgeKind ?? "observable"} bridge`,
          dependsOnStepIds: [fromStep.id],
          sourceNodeIds: unique([...fromStep.sourceNodeIds, ...toStep.sourceNodeIds]),
          sourceEdgeIds: unique([pair.bridgeEdgeId]),
          inputSymbols: [fromBinding.symbol],
          outputSymbols: [toBinding.symbol],
          expression: null,
          assumptions: [pair.reason],
          sourceRefs: pair.sourceRefs,
          admission,
          executionStatus: "not_started",
        };
        steps.push(transformedStep);
      }
      let comparisonInputStep = transformedStep ?? fromStep;
      if (
        transformedStep &&
        (pair.errorKind === "bounded" || pair.errorKind === "statistical") &&
        pair.errorExpression
      ) {
        const uncertaintyStep: StepDraft = {
          id: `derivation-step:uncertainty:${index + 1}:${pair.bridgeEdgeId ?? "registered"}`,
          kind: "propagate_uncertainty",
          label: `Propagate ${pair.errorKind} bridge uncertainty`,
          dependsOnStepIds: [transformedStep.id],
          sourceNodeIds: transformedStep.sourceNodeIds,
          sourceEdgeIds: transformedStep.sourceEdgeIds,
          inputSymbols: transformedStep.outputSymbols,
          outputSymbols: transformedStep.outputSymbols,
          expression: pair.errorExpression,
          assumptions: [pair.reason],
          sourceRefs: pair.sourceRefs,
          admission,
          executionStatus: "not_started",
        };
        steps.push(uncertaintyStep);
        comparisonInputStep = uncertaintyStep;
      }
      steps.push({
        id: `derivation-step:compare:${index + 1}:${pair.fromBadgeId}:${pair.toBadgeId}`,
        kind: "compare_observables",
        label: `Compare ${fromBinding.canonicalObservableId} with ${toBinding.canonicalObservableId}`,
        dependsOnStepIds: unique([comparisonInputStep.id, toStep.id]),
        sourceNodeIds: unique([...fromStep.sourceNodeIds, ...toStep.sourceNodeIds]),
        sourceEdgeIds: unique([pair.bridgeEdgeId]),
        inputSymbols: unique([fromBinding.symbol, toBinding.symbol]),
        outputSymbols: unique([master.request.targetObservable ?? "comparison_result"]),
        expression: null,
        assumptions: [pair.reason],
        sourceRefs: pair.sourceRefs,
        admission,
        executionStatus: "not_started",
      });
    });

  const dependencyIds = new Set(steps.flatMap((step) => step.dependsOnStepIds));
  const leafIds = steps.filter((step) => !dependencyIds.has(step.id)).map((step) => step.id);
  steps.push({
    id: `derivation-step:assemble:${master.planId}`,
    kind: "assemble_solver_input",
    label: `Assemble non-terminal solver input for ${master.request.target}`,
    dependsOnStepIds: leafIds,
    sourceNodeIds: relevant.nodes.map((node) => node.id),
    sourceEdgeIds: relevant.edges.map((edge) => edge.sourceEdgeId),
    inputSymbols: unique(relevant.nodes.flatMap((node) => node.outputSymbols)),
    outputSymbols: unique([master.request.targetObservable ?? "solver_input"]),
    expression: null,
    assumptions: master.request.initialBoundaryConditions,
    sourceRefs: unique(relevant.nodes.flatMap((node) => node.sourceRefs)),
    admission,
    executionStatus: "not_started",
  });
  return steps;
}

function topologicalOrder(steps: StepDraft[]): TheoryDerivationProgramStepV1[] | null {
  const byId = new Map(steps.map((step) => [step.id, step]));
  const indexById = new Map(steps.map((step, index) => [step.id, index]));
  const indegree = new Map(steps.map((step) => [step.id, step.dependsOnStepIds.length]));
  const dependents = new Map<string, string[]>();
  steps.forEach((step) => step.dependsOnStepIds.forEach((dependency) => {
    if (!byId.has(dependency)) return;
    dependents.set(dependency, [...(dependents.get(dependency) ?? []), step.id]);
  }));
  const queue = steps
    .filter((step) => (indegree.get(step.id) ?? 0) === 0)
    .map((step) => step.id);
  const ordered: StepDraft[] = [];
  while (queue.length > 0) {
    queue.sort((left, right) => (indexById.get(left) ?? 0) - (indexById.get(right) ?? 0));
    const id = queue.shift() as string;
    const step = byId.get(id);
    if (!step) continue;
    ordered.push(step);
    for (const dependent of dependents.get(id) ?? []) {
      const next = (indegree.get(dependent) ?? 0) - 1;
      indegree.set(dependent, next);
      if (next === 0) queue.push(dependent);
    }
  }
  if (ordered.length !== steps.length) return null;
  return ordered.map((step, ordinal) => ({ ...step, ordinal }));
}

function failureSteps(
  master: TheoryMasterProblemV1,
  receipts: TheoryDerivationFailureReceiptV1[],
): TheoryDerivationProgramStepV1[] {
  const usable = receipts.length > 0 ? receipts : [{
    id: `derivation-failure:${master.planId}:route`,
    code: "solver_route_not_admitted" as const,
    stage: "solver_route_admission" as const,
    message: "No solver route was admitted.",
    relatedIds: master.selectedBadgeIds,
    sourceRefs: [],
    retryable: true,
    repair: "Resolve the Master Problem admission requirements and recompile.",
    assistantAnswer: false as const,
    terminalEligible: false as const,
  }];
  return usable.map((receipt, ordinal) => ({
    id: `derivation-step:failure:${receipt.id}`,
    ordinal,
    kind: "report_typed_failure",
    label: receipt.message,
    dependsOnStepIds: [],
    sourceNodeIds: [],
    sourceEdgeIds: [],
    inputSymbols: [],
    outputSymbols: [],
    expression: null,
    assumptions: [],
    sourceRefs: receipt.sourceRefs,
    admission: "blocked",
    executionStatus: "not_started",
  }));
}

function solverFamily(master: TheoryMasterProblemV1): TheoryDerivationSolverFamilyV1 {
  if (master.compile.status === "noncomputable") return "symbolic_reference";
  if (HARD_BLOCKED_MASTER_STATUSES.has(master.compile.status)) return "none";
  if (master.request.operation === "compare") return "observational_comparison";
  if (master.request.operation === "prove") return "formal_proof";
  if (master.request.operation === "explain") return "evidence_synthesis";
  if (relevantMasterParts(master).nodes.some((node) => node.computabilityStatus === "runtime_required")) return "numerical_runtime";
  return "symbolic_algebra";
}

function solverRequirements(family: TheoryDerivationSolverFamilyV1): string[] {
  switch (family) {
    case "symbolic_algebra": return ["registered_symbolic_or_scalar_solver", "observation_reentry"];
    case "numerical_runtime": return ["registered_runtime_adapter", "runtime_receipt_reentry"];
    case "observational_comparison": return ["resolved_observable_bindings", "uncertainty_aware_comparison"];
    case "formal_proof": return ["declared_formal_system", "proof_obligation_evidence"];
    case "evidence_synthesis": return ["source_backed_evidence_synthesis"];
    case "symbolic_reference": return ["symbolic_reference_only"];
    default: return [];
  }
}

function routeReason(
  family: TheoryDerivationSolverFamilyV1,
  admission: TheoryDerivationRouteAdmissionV1,
): string {
  if (admission === "blocked") return "The Master Problem or dependency graph failed a hard scientific admission check.";
  if (admission === "not_admitted") return "The material is retained as a formal reference, not an executable solver route.";
  if (admission === "conditional") return `The ${family} route requires preflight bindings or declarations before execution.`;
  return `The ${family} route is eligible for the agent-owned completed solver path.`;
}

export function compileTheoryDerivationProgram(
  input: CompileTheoryDerivationProgramInput,
): TheoryDerivationProgramV1 {
  const master = input.masterProblem;
  const obligations = buildObligations(master);
  const failureReceipts = buildFailureReceipts(master);
  const family = solverFamily(master);
  const blockedByMaster = HARD_BLOCKED_MASTER_STATUSES.has(master.compile.status);
  const blockedByObligation = obligations.some((obligation) => obligation.status === "blocked");
  const preflightRequired = obligations.some((obligation) =>
    obligation.phase === "preflight" && obligation.status === "required"
  );
  let status: TheoryDerivationProgramStatusV1 = blockedByMaster || blockedByObligation
    ? "blocked"
    : master.compile.status === "noncomputable"
      ? "reference_only"
      : preflightRequired
        ? "conditional"
        : "ready";
  let routeAdmission: TheoryDerivationRouteAdmissionV1 = status === "blocked"
    ? "blocked"
    : status === "reference_only"
      ? "not_admitted"
      : status === "conditional"
        ? "conditional"
        : "admitted";

  const stepAdmission: TheoryDerivationStepAdmissionV1 = status === "reference_only"
    ? "reference_only"
    : status === "conditional"
      ? "conditional"
      : "admitted";

  if (status === "blocked" && failureReceipts.length === 0) {
    failureReceipts.push({
      id: `derivation-failure:${master.planId}:route`,
      code: "solver_route_not_admitted",
      stage: "solver_route_admission",
      message: "Scientific preflight obligations block the solver route.",
      relatedIds: obligations
        .filter((obligation) => obligation.status === "blocked")
        .flatMap((obligation) => obligation.relatedIds),
      sourceRefs: obligations
        .filter((obligation) => obligation.status === "blocked")
        .flatMap((obligation) => obligation.sourceRefs),
      retryable: true,
      repair: "Resolve the blocked preflight obligations and compile a new Master Problem.",
      assistantAnswer: false,
      terminalEligible: false,
    });
  }
  let steps: TheoryDerivationProgramStepV1[];
  if (status === "blocked") {
    steps = failureSteps(master, failureReceipts);
  } else {
    const drafts = buildExecutableSteps(master, stepAdmission);
    const ordered = topologicalOrder(drafts);
    if (!ordered) {
      const receipt: TheoryDerivationFailureReceiptV1 = {
        id: `derivation-failure:${master.planId}:${failureReceipts.length + 1}`,
        code: "cyclic_dependency",
        stage: "dependency_analysis",
        message: "Selected graph relations form a cycle and cannot be emitted as a derivation DAG.",
        relatedIds: master.edges.map((edge) => edge.sourceEdgeId),
        sourceRefs: unique(master.nodes.flatMap((node) => node.sourceRefs)),
        retryable: false,
        repair: "Select an acyclic derivation cut or register a fixed-point/numerical solver contract explicitly.",
        assistantAnswer: false,
        terminalEligible: false,
      };
      failureReceipts.push(receipt);
      status = "blocked";
      routeAdmission = "blocked";
      steps = failureSteps(master, [receipt]);
    } else {
      steps = ordered;
    }
  }

  const bridgeErrorExpressions = unique(master.observableResolution.pairChecks.map((pair) =>
    pair.errorKind === "bounded" || pair.errorKind === "statistical" ? pair.errorExpression : null
  ));
  return buildTheoryDerivationProgramV1({
    generatedAt: input.generatedAt ?? master.generatedAt,
    programId: `theory-derivation-program:${master.planId}`,
    sourceMasterProblemPlanId: master.planId,
    graphId: master.graphId,
    operation: master.request.operation,
    target: master.request.target,
    targetObservable: master.request.targetObservable,
    status,
    solverRoute: {
      family: status === "blocked" ? "none" : family,
      admission: routeAdmission,
      solverRequirements: solverRequirements(status === "blocked" ? "none" : family),
      reason: routeReason(status === "blocked" ? "none" : family, routeAdmission),
      executorOwner: "agent_runtime",
      postToolModelStepRequired: true,
    },
    steps,
    obligations,
    failureReceipts,
    uncertaintyPlan: {
      placementEntropyBits: master.uncertaintyLedger.placementEntropyBits,
      openWorldEntropyBits: master.uncertaintyLedger.openWorldEntropyBits,
      outOfGraphProbability: master.uncertaintyLedger.outOfGraphProbability,
      bridgeErrorExpressions,
      propagationRequired: bridgeErrorExpressions.length > 0,
      interpretation: "routing_and_derivation_telemetry_not_truth_probability",
    },
    claimBoundary: {
      temporaryProgram: true,
      executesTools: false,
      assistantAnswer: false,
      terminalEligible: false,
      completedSolverPathRequired: true,
    },
  });
}
