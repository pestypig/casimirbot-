import {
  THEORY_EXPERIMENT_EXECUTION_CLOSURE_HASH_DOMAIN,
  THEORY_EXPERIMENT_EXECUTION_CLOSURE_RANKING_POLICY_ID,
  THEORY_EXPERIMENT_EXECUTION_CLOSURE_RANKING_POLICY_V1,
  buildTheoryExperimentExecutionClosureV1,
  type TheoryExperimentExecutionClosureAxisStatusV1,
  type TheoryExperimentExecutionClosureAxisV1,
  type TheoryExperimentExecutionClosureCandidateV1,
  type TheoryExperimentExecutionClosureEvidenceObservationV1,
  type TheoryExperimentExecutionClosureV1,
} from "../contracts/theory-experiment-execution-closure.v1";
import { computeCasimirSpecValueSha256V1 } from "../contracts/casimir-spec-scientific-claim-ir.v1";
import type { TheoryExperimentProcedureV1 } from "../contracts/theory-experiment-procedure.v1";

export type CompileTheoryExperimentExecutionClosureInput = {
  procedure: TheoryExperimentProcedureV1;
  procedureArtifactRef: string;
  turnId?: string;
  evidenceObservations?: TheoryExperimentExecutionClosureEvidenceObservationV1[];
  generatedAt?: string;
  closureId?: string;
  empiricalObservationSchemaRegistered?: boolean;
};

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const evidenceFor = (
  evidence: TheoryExperimentExecutionClosureEvidenceObservationV1[],
  kind: TheoryExperimentExecutionClosureEvidenceObservationV1["kind"],
  candidateId: string,
): TheoryExperimentExecutionClosureEvidenceObservationV1[] =>
  evidence.filter(
    (entry) =>
      entry.kind === kind &&
      entry.scope === "shared_procedure_evidence" &&
      entry.lineage.candidateBadgeIds.includes(candidateId),
  );

const evidenceStatus = (
  evidence: TheoryExperimentExecutionClosureEvidenceObservationV1[],
  kind: TheoryExperimentExecutionClosureEvidenceObservationV1["kind"],
  applicable: boolean,
  candidateId: string,
): {
  status: TheoryExperimentExecutionClosureAxisStatusV1;
  refs: string[];
} => {
  if (!applicable) return { status: "not_applicable", refs: [] };
  const matching = evidenceFor(evidence, kind, candidateId);
  const satisfying = matching.filter((entry) => entry.closureSatisfied);
  if (satisfying.length > 0) {
    return {
      status: "satisfied",
      refs: satisfying.map((entry) => entry.artifactRef),
    };
  }
  if (matching.some((entry) => entry.status === "failed")) {
    return {
      status: "failed",
      refs: matching.map((entry) => entry.artifactRef),
    };
  }
  if (matching.some((entry) => entry.status === "blocked")) {
    return {
      status: "blocked",
      refs: matching.map((entry) => entry.artifactRef),
    };
  }
  return {
    status: "missing",
    refs: matching.map((entry) => entry.artifactRef),
  };
};

const bridgeStatus = (
  edge: TheoryExperimentProcedureV1["masterProblem"]["edges"][number],
): "verified" | "partial" | "missing" => {
  if (
    edge.dimensionalStatus === "incompatible" ||
    edge.domainStatus === "incompatible" ||
    edge.symbolMap.some((entry) => entry.status === "missing")
  ) {
    return "missing";
  }
  if (
    edge.dimensionalStatus !== "compatible" ||
    edge.domainStatus !== "compatible" ||
    edge.symbolMap.some((entry) => entry.status === "partial")
  ) {
    return "partial";
  }
  return "verified";
};

const axis = (
  axisId: TheoryExperimentExecutionClosureAxisV1["axisId"],
  status: TheoryExperimentExecutionClosureAxisStatusV1,
  evidenceRefs: string[],
  reason: string,
): TheoryExperimentExecutionClosureAxisV1 => ({
  axisId,
  status,
  applicable: status !== "not_applicable",
  evidenceRefs: unique(evidenceRefs),
  reason,
});

const axisCredit = (
  status: TheoryExperimentExecutionClosureAxisStatusV1,
): number => {
  if (status === "satisfied") return 1;
  if (status === "partial") return 0.5;
  return 0;
};

const numericalBackendRegistered = (
  procedure: TheoryExperimentProcedureV1,
): boolean =>
  procedure.lanyonEligibility.requestedCaseId ===
    "advection_diffusion_full_1d" &&
  procedure.lanyonEligibility.status === "eligible";

const derivationStepAdmitsPath = (
  step: TheoryExperimentProcedureV1["derivationProgram"]["steps"][number],
): boolean => step.admission === "admitted" || step.admission === "conditional";

const derivationStepsOnTargetPath = (
  steps: TheoryExperimentProcedureV1["derivationProgram"]["steps"],
): TheoryExperimentProcedureV1["derivationProgram"]["steps"] => {
  const stepById = new Map(steps.map((step) => [step.id, step]));
  const targetPathStepIds = new Set(
    steps
      .filter((step) => step.kind === "assemble_solver_input")
      .map((step) => step.id),
  );
  const pendingStepIds = [...targetPathStepIds];
  for (let index = 0; index < pendingStepIds.length; index += 1) {
    const step = stepById.get(pendingStepIds[index]);
    if (!step) continue;
    for (const dependencyStepId of step.dependsOnStepIds) {
      if (
        targetPathStepIds.has(dependencyStepId) ||
        !stepById.has(dependencyStepId)
      ) {
        continue;
      }
      targetPathStepIds.add(dependencyStepId);
      pendingStepIds.push(dependencyStepId);
    }
  }
  return steps.filter((step) => targetPathStepIds.has(step.id));
};

const reachesCandidateContext = (input: {
  candidateId: string;
  candidateIds: string[];
  nodeIdsByCandidateId: Map<string, Set<string>>;
  admittedEdges: TheoryExperimentProcedureV1["masterProblem"]["edges"];
}): boolean => {
  const sourceNodeIds =
    input.nodeIdsByCandidateId.get(input.candidateId) ?? new Set<string>();
  if (sourceNodeIds.size === 0) return false;
  const contextCandidateIds = input.candidateIds.filter(
    (candidateId) => candidateId !== input.candidateId,
  );
  if (contextCandidateIds.length === 0) return true;

  const adjacentNodeIds = new Map<string, Set<string>>();
  const connect = (fromNodeId: string, toNodeId: string): void => {
    const adjacent = adjacentNodeIds.get(fromNodeId) ?? new Set<string>();
    adjacent.add(toNodeId);
    adjacentNodeIds.set(fromNodeId, adjacent);
  };
  for (const edge of input.admittedEdges) {
    connect(edge.fromNodeId, edge.toNodeId);
    connect(edge.toNodeId, edge.fromNodeId);
  }

  const reachableNodeIds = new Set(sourceNodeIds);
  const pendingNodeIds = [...sourceNodeIds];
  for (let index = 0; index < pendingNodeIds.length; index += 1) {
    const nodeId = pendingNodeIds[index];
    for (const adjacentNodeId of adjacentNodeIds.get(nodeId) ?? []) {
      if (reachableNodeIds.has(adjacentNodeId)) continue;
      reachableNodeIds.add(adjacentNodeId);
      pendingNodeIds.push(adjacentNodeId);
    }
  }

  return contextCandidateIds.every((candidateId) => {
    const contextNodeIds =
      input.nodeIdsByCandidateId.get(candidateId) ?? new Set<string>();
    return (
      contextNodeIds.size > 0 &&
      [...contextNodeIds].some((nodeId) => reachableNodeIds.has(nodeId))
    );
  });
};

const candidateRows = (input: {
  procedure: TheoryExperimentProcedureV1;
  evidence: TheoryExperimentExecutionClosureEvidenceObservationV1[];
}): TheoryExperimentExecutionClosureCandidateV1[] => {
  const candidateIds = unique([
    ...input.procedure.request.selectedBadgeIds,
    ...input.procedure.request.comparisonBadgeIds,
  ]);
  const selected = new Set(input.procedure.request.selectedBadgeIds);
  const nodeIdsByCandidateId = new Map(
    candidateIds.map((candidateId) => [
      candidateId,
      new Set(
        input.procedure.masterProblem.nodes
          .filter((node) => node.badgeId === candidateId)
          .map((node) => node.id),
      ),
    ]),
  );
  const pathSteps =
    input.procedure.derivationProgram.solverRoute.admission === "admitted" ||
    input.procedure.derivationProgram.solverRoute.admission === "conditional"
      ? derivationStepsOnTargetPath(
          input.procedure.derivationProgram.steps.filter(
            derivationStepAdmitsPath,
          ),
        )
      : [];
  const admittedEdges = input.procedure.masterProblem.edges.filter(
    (edge) =>
      bridgeStatus(edge) !== "missing" &&
      pathSteps.some(
        (step) =>
          step.sourceEdgeIds.includes(edge.sourceEdgeId) &&
          step.sourceNodeIds.includes(edge.fromNodeId) &&
          step.sourceNodeIds.includes(edge.toNodeId),
      ),
  );
  const comparisonContextRequired = candidateIds.length > 1;
  const formalApplicable =
    input.procedure.request.operation === "prove" ||
    Boolean(input.procedure.request.formalSystem) ||
    input.procedure.lanyonEligibility.status === "eligible";
  const artifactApplicable = input.procedure.lanyonEligibility.requested;
  const numericalApplicable = numericalBackendRegistered(input.procedure);
  const empiricalApplicable = Boolean(input.procedure.request.targetObservable);

  const rows = candidateIds.map((candidateId) => {
    const semantic = evidenceStatus(
      input.evidence,
      "semantic_admission",
      true,
      candidateId,
    );
    const artifact = evidenceStatus(
      input.evidence,
      "artifact_generation_receipt",
      artifactApplicable,
      candidateId,
    );
    const formal = evidenceStatus(
      input.evidence,
      "formal_certificate",
      formalApplicable,
      candidateId,
    );
    const numerical = evidenceStatus(
      input.evidence,
      "numerical_certificate",
      numericalApplicable,
      candidateId,
    );
    const empirical = evidenceStatus(
      input.evidence,
      "empirical_observation",
      empiricalApplicable,
      candidateId,
    );
    const nodes = input.procedure.masterProblem.nodes.filter(
      (node) => node.badgeId === candidateId,
    );
    const nodeIds = new Set(nodes.map((node) => node.id));
    const edges = input.procedure.masterProblem.edges.filter(
      (edge) => nodeIds.has(edge.fromNodeId) || nodeIds.has(edge.toNodeId),
    );
    const bridgeStatuses = edges.map(bridgeStatus);
    const steps = input.procedure.derivationProgram.steps.filter((step) =>
      step.sourceNodeIds.some((nodeId) => nodeIds.has(nodeId)),
    );
    const admittedCandidateSteps = pathSteps.filter(
      (step) =>
        step.kind !== "assemble_solver_input" &&
        step.sourceNodeIds.some((nodeId) => nodeIds.has(nodeId)),
    );
    const graphPathReachesContext = reachesCandidateContext({
      candidateId,
      candidateIds,
      nodeIdsByCandidateId,
      admittedEdges,
    });
    const checkpoints = input.procedure.scaleCheckpoints.filter(
      (checkpoint) => checkpoint.badgeId === candidateId,
    );
    const observableBlockers =
      input.procedure.masterProblem.observableResolution.pairChecks
        .filter(
          (check) =>
            check.fromBadgeId === candidateId ||
            check.toBadgeId === candidateId,
        )
        .filter(
          (check) =>
            check.status !== "same_canonical_observable" &&
            check.status !== "approved_bridge",
        )
        .map((check) => `observable:${check.status}`);
    const comparabilityBlockers = unique([
      ...(nodes.length === 0 ? ["master_problem_nodes_missing"] : []),
      ...(bridgeStatuses.includes("missing")
        ? ["registered_bridge_missing_or_incompatible"]
        : []),
      ...(comparisonContextRequired && bridgeStatuses.length === 0
        ? ["registered_bridge_status_missing"]
        : []),
      ...(!graphPathReachesContext ? ["candidate_context_path_missing"] : []),
      ...(admittedCandidateSteps.length === 0
        ? ["candidate_derivation_path_not_admitted"]
        : []),
      ...(input.procedure.derivationProgram.status === "blocked"
        ? ["derivation_program_blocked"]
        : []),
      ...observableBlockers,
    ]);
    const graphAxisStatus: TheoryExperimentExecutionClosureAxisStatusV1 =
      nodes.length === 0 ||
      bridgeStatuses.includes("missing") ||
      !graphPathReachesContext ||
      (comparisonContextRequired && bridgeStatuses.length === 0)
        ? "blocked"
        : bridgeStatuses.includes("partial") ||
            input.procedure.masterProblem.compile.status !== "executable"
          ? "partial"
          : "satisfied";
    const derivationAxisStatus: TheoryExperimentExecutionClosureAxisStatusV1 =
      input.procedure.derivationProgram.status === "blocked"
        ? "blocked"
        : admittedCandidateSteps.length === 0
          ? steps.length === 0
            ? "missing"
            : "blocked"
          : input.procedure.derivationProgram.status === "ready" &&
              admittedCandidateSteps.every(
                (step) => step.admission === "admitted",
              )
            ? "satisfied"
            : "partial";
    const scaleAxisStatus: TheoryExperimentExecutionClosureAxisStatusV1 =
      checkpoints.length > 0 ? "satisfied" : "missing";
    const axes: TheoryExperimentExecutionClosureAxisV1[] = [
      axis(
        "semantic_identity",
        semantic.status,
        semantic.refs,
        semantic.status === "satisfied"
          ? "A current-turn admitted semantic definition is shared by the comparison."
          : "The canonical scientific definition has not been admitted for this closure.",
      ),
      axis(
        "graph_congruence",
        graphAxisStatus,
        [],
        graphAxisStatus === "satisfied"
          ? "The candidate has registered Master Problem nodes and a derivation-backed graph path to its comparison context."
          : "Graph registration, candidate-context connectivity, bridge identity, dimensions, or domains remain partial or blocked.",
      ),
      axis(
        "derivation_readiness",
        derivationAxisStatus,
        [],
        derivationAxisStatus === "satisfied"
          ? "The dependency DAG contains an admitted derivation path for this candidate."
          : "The derivation path is incomplete, conditional, or blocked.",
      ),
      axis(
        "scale_localization",
        scaleAxisStatus,
        [],
        scaleAxisStatus === "satisfied"
          ? "At least one dependency-ordered scale checkpoint locates the candidate."
          : "No registered scale checkpoint locates this candidate.",
      ),
      axis(
        "artifact_admission",
        artifact.status,
        artifact.refs,
        artifactApplicable
          ? "A pinned producer admission is required but does not validate generated code."
          : "No external artifact producer was requested.",
      ),
      axis(
        "formal_replay",
        formal.status,
        formal.refs,
        formalApplicable
          ? "Formal status applies only to the exact proposition, imports, axioms, and pinned toolchain."
          : "No formal replay obligation is declared for this request.",
      ),
      axis(
        "independent_numerical_replay",
        numerical.status,
        numerical.refs,
        numericalApplicable
          ? "Numerical status applies to the frozen registered backend, two lineages, tolerances, and observables."
          : input.procedure.lanyonEligibility.requested
            ? "No registered numerical backend exists for this selected Lanyon case."
            : "No independent numerical replay is applicable.",
      ),
      axis(
        "empirical_grounding",
        empirical.status,
        empirical.refs,
        empiricalApplicable
          ? "A calibrated observation of the declared observable is required; simulation agreement is not empirical evidence."
          : "The request does not declare a target observable.",
      ),
    ];
    const applicableAxes = axes.filter((entry) => entry.applicable);
    const credit = applicableAxes.reduce(
      (sum, entry) => sum + axisCredit(entry.status),
      0,
    );
    const evidenceCoverageScore =
      applicableAxes.length === 0
        ? 0
        : Math.round((credit / applicableAxes.length) * 100);
    return {
      candidateId,
      badgeId: candidateId,
      role: selected.has(candidateId)
        ? ("selected" as const)
        : ("comparison" as const),
      comparable: comparabilityBlockers.length === 0,
      comparabilityBlockers,
      masterProblemNodeIds: nodes.map((node) => node.id),
      derivationStepIds: steps.map((step) => step.id),
      scaleCheckpointOrdinals: checkpoints.map(
        (checkpoint) => checkpoint.dependencyOrdinal,
      ),
      bridgeStatuses,
      axes,
      applicableAxisCount: applicableAxes.length,
      satisfiedAxisCount: applicableAxes.filter(
        (entry) => entry.status === "satisfied",
      ).length,
      evidenceCoverageScore,
      rankingGroup: null as number | null,
      displayOrdinal: 0,
      supportingEvidenceRefs: unique(
        axes.flatMap((entry) => entry.evidenceRefs),
      ),
      interpretation:
        "evidence_closure_priority_not_truth_probability" as const,
    };
  });

  rows.sort((left, right) => {
    if (left.comparable !== right.comparable) return left.comparable ? -1 : 1;
    if (right.evidenceCoverageScore !== left.evidenceCoverageScore) {
      return right.evidenceCoverageScore - left.evidenceCoverageScore;
    }
    if (left.role !== right.role) return left.role === "selected" ? -1 : 1;
    const leftOrdinal = Math.min(
      ...left.scaleCheckpointOrdinals,
      Number.MAX_SAFE_INTEGER,
    );
    const rightOrdinal = Math.min(
      ...right.scaleCheckpointOrdinals,
      Number.MAX_SAFE_INTEGER,
    );
    if (leftOrdinal !== rightOrdinal) return leftOrdinal - rightOrdinal;
    return left.candidateId.localeCompare(right.candidateId);
  });
  let rankingGroup = 0;
  let priorKey = "";
  rows.forEach((row, index) => {
    const key = `${row.comparable}:${row.evidenceCoverageScore}`;
    if (key !== priorKey) rankingGroup += 1;
    row.rankingGroup = row.comparable ? rankingGroup : null;
    row.displayOrdinal = index + 1;
    priorKey = key;
  });
  return rows;
};

export async function compileTheoryExperimentExecutionClosureV1(
  input: CompileTheoryExperimentExecutionClosureInput,
): Promise<TheoryExperimentExecutionClosureV1> {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const evidence = unique(input.evidenceObservations ?? []).sort(
    (left, right) => left.artifactRef.localeCompare(right.artifactRef),
  );
  const candidates = candidateRows({
    procedure: input.procedure,
    evidence,
  });
  const comparable = candidates.filter((candidate) => candidate.comparable);
  const topScore = comparable[0]?.evidenceCoverageScore ?? null;
  const topCandidateIds =
    topScore === null
      ? []
      : comparable
          .filter((candidate) => candidate.evidenceCoverageScore === topScore)
          .map((candidate) => candidate.candidateId);
  const hardBlocked =
    input.procedure.masterProblem.compile.runtimeAdmission === "blocked" ||
    input.procedure.derivationProgram.status === "blocked";
  const rankingOutcome: TheoryExperimentExecutionClosureV1["ranking"]["outcome"] =
    candidates.length === 0
      ? "no_candidates"
      : hardBlocked
        ? "blocked"
        : comparable.length === 0
          ? "incomparable"
          : topCandidateIds.length === 1
            ? "unique_preference"
            : "tied_top";
  const policySha256 = await computeCasimirSpecValueSha256V1({
    domain: "theory-experiment-execution-closure-ranking-policy/v1",
    value: THEORY_EXPERIMENT_EXECUTION_CLOSURE_RANKING_POLICY_V1,
  });

  const allCandidatesComparable =
    candidates.length > 0 && comparable.length === candidates.length;
  const axisSatisfiedAcrossAllCandidates = (
    axisId: TheoryExperimentExecutionClosureAxisV1["axisId"],
  ): boolean =>
    candidates.length > 0 &&
    candidates.every((candidate) => {
      const candidateAxis = candidate.axes.find(
        (entry) => entry.axisId === axisId,
      );
      return (
        candidateAxis?.applicable === true &&
        candidateAxis.status === "satisfied"
      );
    });
  const axisApplicable = (
    axisId: TheoryExperimentExecutionClosureAxisV1["axisId"],
  ): boolean =>
    candidates.some(
      (candidate) =>
        candidate.axes.find((entry) => entry.axisId === axisId)?.applicable ===
        true,
    );
  const semanticEvidenceSatisfied =
    axisSatisfiedAcrossAllCandidates("semantic_identity");
  const formalEvidenceSatisfied =
    axisSatisfiedAcrossAllCandidates("formal_replay");
  const numericalEvidenceSatisfied = axisSatisfiedAcrossAllCandidates(
    "independent_numerical_replay",
  );
  const empiricalEvidenceSatisfied = axisSatisfiedAcrossAllCandidates(
    "empirical_grounding",
  );
  const semanticSatisfied =
    allCandidatesComparable && semanticEvidenceSatisfied;
  const formalSatisfied = semanticSatisfied && formalEvidenceSatisfied;
  const numericalSatisfied = semanticSatisfied && numericalEvidenceSatisfied;
  const empiricalSatisfied = semanticSatisfied && empiricalEvidenceSatisfied;
  const blockerCodes = unique([
    ...(hardBlocked ? ["graph_or_derivation_runtime_blocked"] : []),
    ...(candidates.length === 0 ? ["candidate_set_empty"] : []),
    ...(comparable.length === 0 && candidates.length > 0
      ? ["candidate_set_incomparable"]
      : []),
    ...(comparable.length > 0 && !allCandidatesComparable
      ? ["candidate_set_partially_incomparable"]
      : []),
    ...input.procedure.missingRequirements
      .filter((requirement) => !requirement.retryable)
      .map((requirement) => requirement.code),
  ]);
  const failedEvidenceCodes = evidence
    .filter(
      (entry) =>
        entry.scope === "shared_procedure_evidence" &&
        (entry.status === "failed" || entry.status === "blocked"),
    )
    .map((entry) => `${entry.kind}_${entry.status}`);
  const openRequirementCodes = unique([
    ...input.procedure.missingRequirements.map(
      (requirement) => requirement.code,
    ),
    ...failedEvidenceCodes,
    ...(!semanticEvidenceSatisfied
      ? ["semantic_admission_current_turn_reentry_required"]
      : []),
    ...(axisApplicable("formal_replay") && !formalEvidenceSatisfied
      ? ["formal_certificate_current_turn_reentry_required"]
      : []),
    ...(axisApplicable("independent_numerical_replay") &&
    !numericalEvidenceSatisfied
      ? ["numerical_certificate_current_turn_reentry_required"]
      : []),
    ...(axisApplicable("empirical_grounding") && !empiricalEvidenceSatisfied
      ? ["empirical_observation_current_turn_reentry_required"]
      : []),
    ...(input.procedure.lanyonEligibility.requested &&
    !numericalBackendRegistered(input.procedure)
      ? ["numerical_fixture_unregistered"]
      : []),
    ...(input.procedure.request.targetObservable &&
    input.empiricalObservationSchemaRegistered !== true
      ? ["empirical_observation_schema_unregistered"]
      : []),
  ]);
  const modelSynthesisAllowed =
    semanticSatisfied && allCandidatesComparable && blockerCodes.length === 0;
  const claimCeiling: TheoryExperimentExecutionClosureV1["synthesisReadiness"]["claimCeiling"] =
    empiricalSatisfied
      ? "empirically_grounded_comparison"
      : numericalSatisfied
        ? "numerically_checked_comparison"
        : formalSatisfied
          ? "formally_checked_comparison"
          : semanticSatisfied
            ? "semantic_comparison"
            : "procedure_only";
  const synthesisStatus: TheoryExperimentExecutionClosureV1["synthesisReadiness"]["status"] =
    !modelSynthesisAllowed
      ? "blocked"
      : input.procedure.request.operation === "compare" && candidates.length > 1
        ? "bounded_comparison_ready"
        : "bounded_proposal_ready";
  const stageEvidenceKinds: Record<
    TheoryExperimentProcedureV1["stages"][number]["id"],
    TheoryExperimentExecutionClosureEvidenceObservationV1["kind"][]
  > = {
    question_and_provenance: [],
    semantic_definition: ["semantic_admission"],
    graph_and_scale_localization: [],
    congruence_procedure: [],
    artifact_and_formal_closure: [
      "artifact_generation_receipt",
      "formal_certificate",
    ],
    numerical_and_observational_closure: [
      "numerical_certificate",
      "empirical_observation",
    ],
    evidence_reentry_and_synthesis: [
      "semantic_admission",
      "artifact_generation_receipt",
      "formal_certificate",
      "numerical_certificate",
      "empirical_observation",
    ],
  };
  const aggregateCandidateAxes = (
    axisIds: TheoryExperimentExecutionClosureAxisV1["axisId"][],
  ): TheoryExperimentExecutionClosureV1["stages"][number]["closureStatus"] => {
    const applicableAxes = candidates.flatMap((candidate) =>
      candidate.axes.filter(
        (entry) => axisIds.includes(entry.axisId) && entry.applicable,
      ),
    );
    if (applicableAxes.length === 0) return "not_applicable";
    if (
      applicableAxes.some(
        (entry) => entry.status === "blocked" || entry.status === "failed",
      )
    ) {
      return "blocked";
    }
    return applicableAxes.every((entry) => entry.status === "satisfied")
      ? "satisfied"
      : "partial";
  };
  const structuralStageStatus = (
    stage: TheoryExperimentProcedureV1["stages"][number],
  ): TheoryExperimentExecutionClosureV1["stages"][number]["closureStatus"] =>
    stage.status === "complete"
      ? "satisfied"
      : stage.status === "blocked"
        ? "blocked"
        : stage.status === "not_applicable"
          ? "not_applicable"
          : "partial";
  const closureStageStatus = (
    stage: TheoryExperimentProcedureV1["stages"][number],
  ): TheoryExperimentExecutionClosureV1["stages"][number]["closureStatus"] => {
    switch (stage.id) {
      case "semantic_definition":
        return aggregateCandidateAxes(["semantic_identity"]);
      case "graph_and_scale_localization":
        return aggregateCandidateAxes([
          "graph_congruence",
          "scale_localization",
        ]);
      case "congruence_procedure":
        return aggregateCandidateAxes(["derivation_readiness"]);
      case "artifact_and_formal_closure":
        return aggregateCandidateAxes(["artifact_admission", "formal_replay"]);
      case "numerical_and_observational_closure":
        return aggregateCandidateAxes([
          "independent_numerical_replay",
          "empirical_grounding",
        ]);
      case "evidence_reentry_and_synthesis":
        return modelSynthesisAllowed ? "partial" : "blocked";
      case "question_and_provenance":
      default:
        return structuralStageStatus(stage);
    }
  };
  const stages = input.procedure.stages.map((stage) => ({
    id: stage.id,
    ordinal: stage.ordinal,
    procedureStatus: stage.status,
    closureStatus: closureStageStatus(stage),
    evidenceRefs: unique([
      ...evidence
        .filter(
          (entry) =>
            entry.scope === "shared_procedure_evidence" &&
            stageEvidenceKinds[stage.id].includes(entry.kind),
        )
        .map((entry) => entry.artifactRef),
    ]),
    blockerCodes: unique([
      ...stage.missingRequirementCodes,
      ...evidence
        .filter(
          (entry) =>
            entry.scope === "shared_procedure_evidence" &&
            stageEvidenceKinds[stage.id].includes(entry.kind) &&
            (entry.status === "failed" || entry.status === "blocked"),
        )
        .map((entry) => `${entry.kind}_${entry.status}`),
    ]),
  }));
  const unsigned = {
    generatedAt,
    closureId:
      input.closureId ??
      `theory-experiment-execution-closure:${input.procedure.procedureId}:${generatedAt}`,
    turnId: input.turnId ?? input.procedure.turnId,
    procedureBinding: {
      artifactRef: input.procedureArtifactRef,
      procedureId: input.procedure.procedureId,
      procedureSha256: input.procedure.procedureSha256,
      graphId: input.procedure.graphId,
    },
    candidateSet: {
      candidateIds: candidates.map((candidate) => candidate.candidateId),
      selectedCandidateIds: input.procedure.request.selectedBadgeIds,
      comparisonCandidateIds: input.procedure.request.comparisonBadgeIds,
      evidenceScope: "shared_procedure_evidence" as const,
    },
    evidenceObservations: evidence,
    stages,
    candidates,
    ranking: {
      policyId: THEORY_EXPERIMENT_EXECUTION_CLOSURE_RANKING_POLICY_ID,
      policySha256,
      objective:
        "maximize_admitted_evidence_coverage_then_graph_congruence" as const,
      outcome: rankingOutcome,
      orderedCandidateIds: candidates.map((candidate) => candidate.candidateId),
      topCandidateIds,
      interpretation: "candidate_preference_not_theory_truth" as const,
      probabilityClaimAllowed: false as const,
    },
    synthesisReadiness: {
      status: synthesisStatus,
      claimCeiling,
      modelSynthesisAllowed,
      requiredSupportRefs: unique(
        candidates.flatMap((candidate) =>
          candidate.axes
            .filter((entry) => entry.status === "satisfied")
            .flatMap((entry) => entry.evidenceRefs),
        ),
      ),
      blockerCodes,
      openRequirementCodes,
      reason: modelSynthesisAllowed
        ? `Codex may author a ${claimCeiling.replaceAll("_", " ")} answer using the cited evidence, while retaining every open requirement.`
        : "Every candidate requires an admitted graph/derivation path plus exact current-turn, procedure-scoped semantic evidence before bounded synthesis.",
    },
    nextCapabilityCandidates: input.procedure.capabilityAffordances
      .filter(
        (affordance) =>
          affordance.capabilityId !==
            "theory-experiment-procedure.evaluate_closure" &&
          (affordance.status === "admitted" ||
            affordance.status === "conditional"),
      )
      .map((affordance) => ({
        capabilityId: affordance.capabilityId,
        status: affordance.status as "admitted" | "conditional",
        requiresConfirmation: affordance.requiresConfirmation,
        missingInputKeys: affordance.requiredInputKeys,
        reason: affordance.reason,
      })),
    incompletenessBoundary: {
      outOfGraphMassPreserved: true as const,
      missingRelationsRemainOpenWorld: true as const,
      empiricalObservationSchemaRegistered:
        input.empiricalObservationSchemaRegistered === true,
      failedEvidenceRetainedWithoutSatisfyingClosure: true as const,
      candidateScopedEvidenceMayDiscriminateCandidates: true as const,
    },
    authority: {
      executorOwner: "agent_runtime" as const,
      evaluatesEvidenceOnly: true as const,
      executesTools: false as const,
      ranksEvidenceCoverageOnly: true as const,
      validatesTheory: false as const,
      validatesGeneratedCode: false as const,
      proofAuthority: false as const,
      numericalAuthority: false as const,
      empiricalAuthority: false as const,
      physicalTruthAuthority: false as const,
      assistantAnswer: false as const,
      terminalEligible: false as const,
      postToolModelStepRequired: true as const,
    },
  };
  const closureSha256 = await computeCasimirSpecValueSha256V1({
    domain: THEORY_EXPERIMENT_EXECUTION_CLOSURE_HASH_DOMAIN,
    value: unsigned,
  });
  return buildTheoryExperimentExecutionClosureV1({
    ...unsigned,
    closureSha256,
  });
}
