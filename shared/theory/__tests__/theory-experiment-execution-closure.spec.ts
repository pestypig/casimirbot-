import { describe, expect, it } from "vitest";

import {
  validateTheoryExperimentExecutionClosureIntegrityV1,
  validateTheoryExperimentExecutionClosureV1,
  type TheoryExperimentExecutionClosureEvidenceObservationV1,
} from "../../contracts/theory-experiment-execution-closure.v1";
import type { TheoryExperimentEvidenceBindingV1 } from "../../contracts/theory-experiment-procedure.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildTheoryContextReflection } from "../theory-context-reflector";
import { compileTheoryExperimentExecutionClosureV1 } from "../theory-experiment-execution-closure";
import { compileTheoryExperimentProcedureV1 } from "../theory-experiment-procedure-compiler";

const BADGE_ID = "study.casimir_dp.evidence_map_stage3";
const COMPARISON_BADGE_ID = "test.execution_closure.comparison";
const DECOY_BADGE_ID = "test.execution_closure.decoy";
const TURN_ID = "ask:test:execution-closure";
const PROCEDURE_ID = `${TURN_ID}:procedure`;
const SPEC_SEMANTIC_SHA = "a".repeat(64);
const SPEC_ARTIFACT_SHA = "b".repeat(64);
const PROPOSITION_SHA = "c".repeat(64);

const binding = (
  kind: TheoryExperimentEvidenceBindingV1["kind"],
  artifactRef: string,
  contentSha256: string,
  graphId: string,
): TheoryExperimentEvidenceBindingV1 => ({
  artifactRef,
  kind,
  schema: `test.${kind}.v1`,
  sourceTurnId: TURN_ID,
  admissionTurnId: TURN_ID,
  contentSha256,
  admission: "current_turn_admitted",
  lineage: {
    sourceKind: "semantic_claim_ir",
    procedureId: PROCEDURE_ID,
    candidateBadgeIds: [BADGE_ID],
    casimirSpecId: "casimir-spec:test",
    casimirSpecSemanticSha256: SPEC_SEMANTIC_SHA,
    casimirSpecArtifactSha256: SPEC_ARTIFACT_SHA,
    claims: [
      {
        claimId: "claim:test",
        propositionSha256: PROPOSITION_SHA,
        observableIds: [],
      },
    ],
    sourceGraphId: graphId,
    sourceGraphSnapshotSha256: "d".repeat(64),
    sourceMasterProblemPlanId: null,
    sourceMasterProblemArtifactSha256: null,
    sourceDerivationProgramId: null,
    sourceDerivationProgramArtifactSha256: null,
    requestArtifactSha256: null,
    frozenCase: null,
  },
  authority: "evidence_only",
  assistantAnswer: false,
  terminalEligible: false,
});

const evidence = (
  kind: TheoryExperimentExecutionClosureEvidenceObservationV1["kind"],
  artifactRef: string,
  status: TheoryExperimentExecutionClosureEvidenceObservationV1["status"],
  closureSatisfied: boolean,
  contentSha256: string,
  scope: TheoryExperimentExecutionClosureEvidenceObservationV1["scope"] = "shared_procedure_evidence",
): TheoryExperimentExecutionClosureEvidenceObservationV1 => ({
  artifactRef,
  boundArtifactRef: artifactRef,
  kind,
  schema: `test.${kind}.v1`,
  contentSha256,
  sourceTurnId: TURN_ID,
  status,
  scope,
  closureSatisfied,
  lineage: {
    sourceKind:
      kind === "formal_certificate"
        ? "formal_verification_request"
        : "semantic_claim_ir",
    procedureId: PROCEDURE_ID,
    candidateBadgeIds: [BADGE_ID],
    casimirSpecId: "casimir-spec:test",
    casimirSpecSemanticSha256: SPEC_SEMANTIC_SHA,
    casimirSpecArtifactSha256: SPEC_ARTIFACT_SHA,
    claims: [
      {
        claimId: "claim:test",
        propositionSha256: PROPOSITION_SHA,
        observableIds: [],
      },
    ],
    sourceGraphId: null,
    sourceGraphSnapshotSha256: null,
    sourceMasterProblemPlanId: null,
    sourceMasterProblemArtifactSha256: null,
    sourceDerivationProgramId: null,
    sourceDerivationProgramArtifactSha256: null,
    requestArtifactSha256:
      kind === "formal_certificate" ? "e".repeat(64) : null,
    frozenCase: null,
  },
  authority: "evidence_only",
});

const buildProcedure = async (input?: {
  formalSystem?: string | null;
  lanyonCaseId?: string | null;
}) => {
  const graph = buildNhm2TheoryBadgeGraphV1();
  const generatedAt = "2026-07-26T12:00:00.000Z";
  const reflection = buildTheoryContextReflection({
    graph,
    prompt: "Compare the admitted Stage 3 evidence-map definition.",
    mentionedDomains: [BADGE_ID],
    generatedAt,
    reflectionId: `${TURN_ID}:reflection`,
  });
  const semanticSha = "a".repeat(64);
  return compileTheoryExperimentProcedureV1({
    graph,
    turnId: TURN_ID,
    procedureId: PROCEDURE_ID,
    generatedAt,
    reflection,
    request: {
      operation: input?.formalSystem
        ? "prove"
        : input?.lanyonCaseId
          ? "compare"
          : "explain",
      target: "Stage 3 evidence map",
      targetObservable: input?.lanyonCaseId ? "concentration_field" : null,
      scaleLog10M: null,
      coordinateFrame: input?.lanyonCaseId ? "laboratory" : null,
      initialBoundaryConditions: input?.lanyonCaseId
        ? ["periodic domain", "sinusoidal initial condition"]
        : [],
      formalSystem: input?.formalSystem ?? null,
      requestedPrecision: "1e-3",
      evidenceMaturityCeiling: "diagnostic",
      normalizationStatus: "explicit",
    },
    selectedBadgeIds: [BADGE_ID],
    evidenceBindings: [
      binding(
        "semantic_admission",
        `${TURN_ID}:semantic`,
        semanticSha,
        graph.graphId,
      ),
    ],
    lanyon: {
      requested: Boolean(input?.lanyonCaseId),
      caseId: input?.lanyonCaseId ?? null,
    },
  });
};

const addSyntheticComparison = (
  procedure: Awaited<ReturnType<typeof buildProcedure>>,
  input?: { withDecoyBridge?: boolean },
): void => {
  const sourceNode = procedure.masterProblem.nodes.find(
    (node) => node.badgeId === BADGE_ID,
  );
  const sourceStep = sourceNode
    ? procedure.derivationProgram.steps.find(
        (step) =>
          step.sourceNodeIds.includes(sourceNode.id) &&
          step.sourceEdgeIds.length === 0,
      )
    : null;
  if (!sourceNode || !sourceStep) {
    throw new Error(
      "synthetic comparison fixture requires a source node and step",
    );
  }

  const comparisonNode = {
    ...structuredClone(sourceNode),
    id: "theory-master-node:test:comparison",
    badgeId: COMPARISON_BADGE_ID,
    title: "Synthetic comparison candidate",
  };
  procedure.request.comparisonBadgeIds = [COMPARISON_BADGE_ID];
  procedure.masterProblem.selectedBadgeIds = [
    ...procedure.masterProblem.selectedBadgeIds,
    COMPARISON_BADGE_ID,
  ];
  procedure.masterProblem.nodes.push(comparisonNode);
  const comparisonStep = {
    ...structuredClone(sourceStep),
    id: "derivation-step:node:test:comparison",
    ordinal: procedure.derivationProgram.steps.length + 1,
    label: "Evaluate the synthetic comparison candidate",
    dependsOnStepIds: [],
    sourceNodeIds: [comparisonNode.id],
    sourceEdgeIds: [],
  };
  procedure.derivationProgram.steps.push(comparisonStep);
  const assembleStep = procedure.derivationProgram.steps.find(
    (step) => step.kind === "assemble_solver_input",
  );
  if (!assembleStep) {
    throw new Error("synthetic comparison fixture requires an assembly step");
  }
  assembleStep.dependsOnStepIds = [
    ...new Set([...assembleStep.dependsOnStepIds, comparisonStep.id]),
  ];
  assembleStep.sourceNodeIds = [
    ...new Set([...assembleStep.sourceNodeIds, comparisonNode.id]),
  ];

  const sourceCheckpoint = procedure.scaleCheckpoints.find(
    (checkpoint) => checkpoint.badgeId === BADGE_ID,
  );
  if (sourceCheckpoint) {
    procedure.scaleCheckpoints.push({
      ...structuredClone(sourceCheckpoint),
      badgeId: COMPARISON_BADGE_ID,
      dependencyOrdinal: procedure.scaleCheckpoints.length,
    });
  }

  if (!input?.withDecoyBridge) return;

  const decoyNode = {
    ...structuredClone(sourceNode),
    id: "theory-master-node:test:decoy",
    badgeId: DECOY_BADGE_ID,
    title: "Synthetic non-candidate decoy",
  };
  const sourceEdgeId = "test-disconnected-candidate-to-decoy";
  procedure.masterProblem.nodes.push(decoyNode);
  procedure.masterProblem.edges.push({
    id: `theory-master-edge:${sourceEdgeId}`,
    sourceEdgeId,
    fromNodeId: comparisonNode.id,
    toNodeId: decoyNode.id,
    operator: "derives",
    derivationClass: "retrieved",
    symbolMap: [
      {
        fromSymbol: "synthetic",
        toSymbol: "synthetic",
        status: "verified",
      },
    ],
    dimensionalStatus: "compatible",
    domainStatus: "compatible",
    verificationRequirements: [],
    claimBoundaryNote:
      "A decoy edge must not establish candidate-context comparability.",
  });
  const relationStep = {
    ...structuredClone(sourceStep),
    id: "derivation-step:edge:test:comparison-to-decoy",
    ordinal: procedure.derivationProgram.steps.length + 1,
    kind: "apply_graph_relation" as const,
    label: "Apply the synthetic disconnected decoy relation",
    dependsOnStepIds: [comparisonStep.id],
    sourceNodeIds: [comparisonNode.id, decoyNode.id],
    sourceEdgeIds: [sourceEdgeId],
    inputSymbols: ["synthetic"],
    outputSymbols: ["synthetic"],
    expression: null,
    assumptions: [],
    sourceRefs: [],
  };
  procedure.derivationProgram.steps.push(relationStep);
  assembleStep.dependsOnStepIds = [
    ...new Set([...assembleStep.dependsOnStepIds, relationStep.id]),
  ];
};

describe("theory experiment execution closure", () => {
  it("builds a hash-bound nonterminal evidence ranking and never a truth probability", async () => {
    const procedure = await buildProcedure();
    const closure = await compileTheoryExperimentExecutionClosureV1({
      procedure,
      procedureArtifactRef: `${TURN_ID}:procedure-artifact`,
      evidenceObservations: [
        evidence(
          "semantic_admission",
          `${TURN_ID}:semantic`,
          "admitted",
          true,
          "a".repeat(64),
        ),
      ],
      generatedAt: "2026-07-26T12:00:01.000Z",
    });

    expect(validateTheoryExperimentExecutionClosureV1(closure)).toEqual([]);
    expect(
      await validateTheoryExperimentExecutionClosureIntegrityV1(closure),
    ).toEqual([]);
    expect(closure).toMatchObject({
      ranking: {
        outcome: "unique_preference",
        interpretation: "candidate_preference_not_theory_truth",
        probabilityClaimAllowed: false,
      },
      synthesisReadiness: {
        status: "bounded_proposal_ready",
        claimCeiling: "semantic_comparison",
        modelSynthesisAllowed: true,
      },
      authority: {
        executorOwner: "agent_runtime",
        evaluatesEvidenceOnly: true,
        executesTools: false,
        ranksEvidenceCoverageOnly: true,
        validatesTheory: false,
        physicalTruthAuthority: false,
        assistantAnswer: false,
        terminalEligible: false,
      },
    });
    expect(closure.candidates[0]).toMatchObject({
      candidateId: BADGE_ID,
      interpretation: "evidence_closure_priority_not_truth_probability",
    });
  });

  it("keeps a bound evidence digest as a non-satisfying reference until its exact payload re-enters", async () => {
    const procedure = await buildProcedure();
    const closure = await compileTheoryExperimentExecutionClosureV1({
      procedure,
      procedureArtifactRef: `${TURN_ID}:procedure-artifact`,
      evidenceObservations: [
        evidence(
          "semantic_admission",
          `${TURN_ID}:semantic`,
          "referenced",
          false,
          "a".repeat(64),
          "bound_procedure_reference",
        ),
      ],
      generatedAt: "2026-07-26T12:00:01.000Z",
    });

    expect(validateTheoryExperimentExecutionClosureV1(closure)).toEqual([]);
    expect(
      await validateTheoryExperimentExecutionClosureIntegrityV1(closure),
    ).toEqual([]);
    expect(closure.evidenceObservations[0]).toMatchObject({
      status: "referenced",
      scope: "bound_procedure_reference",
      closureSatisfied: false,
    });
    expect(
      closure.candidates[0].axes.find(
        (entry) => entry.axisId === "semantic_identity",
      ),
    ).toMatchObject({ status: "missing", evidenceRefs: [] });
    expect(
      closure.stages.find((stage) => stage.id === "semantic_definition"),
    ).toMatchObject({
      closureStatus: "partial",
      evidenceRefs: [],
    });
    expect(closure.synthesisReadiness).toMatchObject({
      claimCeiling: "procedure_only",
      modelSynthesisAllowed: false,
    });
    expect(closure.synthesisReadiness.openRequirementCodes).toContain(
      "semantic_admission_current_turn_reentry_required",
    );
  });

  it("retains a valid failed formal result without satisfying formal closure", async () => {
    const procedure = await buildProcedure({ formalSystem: "Lean 4" });
    const closure = await compileTheoryExperimentExecutionClosureV1({
      procedure,
      procedureArtifactRef: `${TURN_ID}:procedure-artifact`,
      evidenceObservations: [
        evidence(
          "semantic_admission",
          `${TURN_ID}:semantic`,
          "admitted",
          true,
          "a".repeat(64),
        ),
        evidence(
          "formal_certificate",
          `${TURN_ID}:failed-formal`,
          "failed",
          false,
          "b".repeat(64),
        ),
      ],
      generatedAt: "2026-07-26T12:00:01.000Z",
    });

    expect(
      closure.evidenceObservations.find(
        (entry) => entry.kind === "formal_certificate",
      ),
    ).toMatchObject({
      status: "failed",
      closureSatisfied: false,
    });
    expect(
      closure.candidates[0].axes.find(
        (entry) => entry.axisId === "formal_replay",
      ),
    ).toMatchObject({ status: "failed" });
    expect(closure.synthesisReadiness.claimCeiling).toBe("procedure_only");
    expect(closure.synthesisReadiness.openRequirementCodes).toContain(
      "formal_certificate_failed",
    );
    expect(closure.synthesisReadiness.openRequirementCodes).not.toContain(
      "formal_certificate_current_turn_reentry_required",
    );
  });

  it("separates static full-1d support from an installed numerical execution catalog", async () => {
    const procedure = await buildProcedure({
      formalSystem: "Lean 4",
      lanyonCaseId: "advection_diffusion_full_1d",
    });
    const closure = await compileTheoryExperimentExecutionClosureV1({
      procedure,
      procedureArtifactRef: `${TURN_ID}:procedure-artifact`,
      numericalExecutionCatalogConfigured: false,
      evidenceObservations: [
        evidence(
          "semantic_admission",
          `${TURN_ID}:semantic`,
          "admitted",
          true,
          "a".repeat(64),
        ),
      ],
      generatedAt: "2026-07-26T12:00:01.000Z",
    });

    expect(
      closure.candidates[0].axes.find(
        (entry) => entry.axisId === "independent_numerical_replay",
      ),
    ).toMatchObject({ applicable: true, status: "blocked" });
    expect(closure.synthesisReadiness.openRequirementCodes).toContain(
      "numerical_execution_catalog_unconfigured",
    );
    expect(closure.synthesisReadiness.openRequirementCodes).not.toContain(
      "numerical_certificate_current_turn_reentry_required",
    );
    expect(closure.synthesisReadiness.claimCeiling).not.toBe(
      "numerically_checked_comparison",
    );
    expect(
      closure.nextCapabilityCandidates.some(
        (entry) =>
          entry.capabilityId.includes("independent-numerical-verifier"),
      ),
    ).toBe(false);
  });

  it("distinguishes bound re-entry, failed evidence, and satisfied formal closure", async () => {
    const procedure = await buildProcedure({ formalSystem: "Lean 4" });
    procedure.evidenceBindings.push(
      binding(
        "formal_certificate",
        `${TURN_ID}:bound-formal`,
        "f".repeat(64),
        procedure.graphId,
      ),
    );
    const missingCurrentTurn = await compileTheoryExperimentExecutionClosureV1({
      procedure,
      procedureArtifactRef: `${TURN_ID}:procedure-artifact`,
      evidenceObservations: [
        evidence(
          "semantic_admission",
          `${TURN_ID}:semantic`,
          "admitted",
          true,
          "a".repeat(64),
        ),
      ],
      generatedAt: "2026-07-26T12:00:01.000Z",
    });
    expect(
      missingCurrentTurn.synthesisReadiness.openRequirementCodes,
    ).toContain("formal_certificate_current_turn_reentry_required");

    const satisfied = await compileTheoryExperimentExecutionClosureV1({
      procedure,
      procedureArtifactRef: `${TURN_ID}:procedure-artifact`,
      evidenceObservations: [
        evidence(
          "semantic_admission",
          `${TURN_ID}:semantic`,
          "admitted",
          true,
          "a".repeat(64),
        ),
        evidence(
          "formal_certificate",
          `${TURN_ID}:bound-formal`,
          "passed",
          true,
          "f".repeat(64),
        ),
      ],
      generatedAt: "2026-07-26T12:00:02.000Z",
    });
    expect(satisfied.synthesisReadiness.openRequirementCodes).not.toContain(
      "formal_certificate_required",
    );
    expect(satisfied.synthesisReadiness.openRequirementCodes).not.toContain(
      "formal_certificate_current_turn_reentry_required",
    );
    expect(
      satisfied.stages.find(
        (stage) => stage.id === "artifact_and_formal_closure",
      )?.blockerCodes,
    ).not.toContain("formal_certificate_required");
  });

  it("requires candidate coverage instead of treating one candidate's evidence as shared closure", async () => {
    const procedure = await buildProcedure();
    addSyntheticComparison(procedure);
    const closure = await compileTheoryExperimentExecutionClosureV1({
      procedure,
      procedureArtifactRef: `${TURN_ID}:procedure-artifact`,
      evidenceObservations: [
        evidence(
          "semantic_admission",
          `${TURN_ID}:semantic`,
          "admitted",
          true,
          "a".repeat(64),
        ),
      ],
      generatedAt: "2026-07-26T12:00:01.000Z",
    });
    expect(closure.synthesisReadiness.openRequirementCodes).toContain(
      "semantic_admission_candidate_coverage_incomplete",
    );
    expect(closure.synthesisReadiness.openRequirementCodes).not.toContain(
      "semantic_admission_current_turn_reentry_required",
    );
  });

  it("requires current-turn re-entry for a bound Lanyon artifact receipt", async () => {
    const procedure = await buildProcedure({
      formalSystem: "Lean 4",
      lanyonCaseId: "advection_diffusion_full_1d",
    });
    procedure.evidenceBindings.push(
      binding(
        "artifact_generation_receipt",
        `${TURN_ID}:bound-lanyon-receipt`,
        "9".repeat(64),
        procedure.graphId,
      ),
    );
    const closure = await compileTheoryExperimentExecutionClosureV1({
      procedure,
      procedureArtifactRef: `${TURN_ID}:procedure-artifact`,
      numericalExecutionCatalogConfigured: false,
      evidenceObservations: [
        evidence(
          "semantic_admission",
          `${TURN_ID}:semantic`,
          "admitted",
          true,
          "a".repeat(64),
        ),
      ],
      generatedAt: "2026-07-26T12:00:01.000Z",
    });
    expect(closure.synthesisReadiness.openRequirementCodes).toContain(
      "artifact_generation_receipt_current_turn_reentry_required",
    );
  });

  it("retains an unscoped failed certificate without attributing it to this procedure", async () => {
    const procedure = await buildProcedure({ formalSystem: "Lean 4" });
    const closure = await compileTheoryExperimentExecutionClosureV1({
      procedure,
      procedureArtifactRef: `${TURN_ID}:procedure-artifact`,
      evidenceObservations: [
        evidence(
          "semantic_admission",
          `${TURN_ID}:semantic`,
          "admitted",
          true,
          "a".repeat(64),
        ),
        evidence(
          "formal_certificate",
          `${TURN_ID}:unrelated-failed-formal`,
          "failed",
          false,
          "b".repeat(64),
          "unscoped_current_turn_evidence",
        ),
      ],
      generatedAt: "2026-07-26T12:00:01.000Z",
    });

    expect(
      closure.evidenceObservations.find(
        (entry) => entry.kind === "formal_certificate",
      ),
    ).toMatchObject({
      status: "failed",
      scope: "unscoped_current_turn_evidence",
      closureSatisfied: false,
    });
    expect(
      closure.candidates[0].axes.find(
        (entry) => entry.axisId === "formal_replay",
      ),
    ).toMatchObject({ status: "missing" });
    expect(closure.synthesisReadiness.openRequirementCodes).not.toContain(
      "formal_certificate_failed",
    );
  });

  it("fails integrity after any ranking or claim-ceiling substitution", async () => {
    const procedure = await buildProcedure();
    const closure = await compileTheoryExperimentExecutionClosureV1({
      procedure,
      procedureArtifactRef: `${TURN_ID}:procedure-artifact`,
      evidenceObservations: [
        evidence(
          "semantic_admission",
          `${TURN_ID}:semantic`,
          "admitted",
          true,
          "a".repeat(64),
        ),
      ],
      generatedAt: "2026-07-26T12:00:01.000Z",
    });
    const tampered = structuredClone(closure);
    tampered.synthesisReadiness.claimCeiling =
      "empirically_grounded_comparison";

    expect(
      await validateTheoryExperimentExecutionClosureIntegrityV1(tampered),
    ).toContain("closureSha256 mismatch");

    const fabricatedTop = structuredClone(closure);
    fabricatedTop.ranking.topCandidateIds = [];
    expect(validateTheoryExperimentExecutionClosureV1(fabricatedTop)).toContain(
      "ranking.topCandidateIds are inconsistent",
    );

    const fabricatedRole = structuredClone(closure);
    fabricatedRole.candidates[0].role = "comparison";
    expect(
      validateTheoryExperimentExecutionClosureV1(fabricatedRole),
    ).toContain("candidates[0].role does not match candidateSet");
  });

  it("blocks numerical affordances early for the eight Lanyon cases without a registered backend", async () => {
    const procedure = await buildProcedure({
      formalSystem: "Lean 4",
      lanyonCaseId: "advection_diffusion_full_2d",
    });

    expect(procedure.missingRequirements.map((entry) => entry.code)).toContain(
      "numerical_fixture_unregistered",
    );
    expect(
      procedure.capabilityAffordances.find(
        (entry) =>
          entry.capabilityId === "theory-independent-numerical-verifier.plan",
      ),
    ).toMatchObject({
      status: "blocked",
      executesAutomatically: false,
    });
  });

  it("does not rank a present candidate whose graph path is disconnected from the comparison context", async () => {
    const procedure = await buildProcedure();
    addSyntheticComparison(procedure, { withDecoyBridge: true });
    const closure = await compileTheoryExperimentExecutionClosureV1({
      procedure,
      procedureArtifactRef: `${TURN_ID}:procedure-artifact`,
      evidenceObservations: [
        evidence(
          "semantic_admission",
          `${TURN_ID}:semantic`,
          "admitted",
          true,
          "a".repeat(64),
        ),
      ],
      generatedAt: "2026-07-26T12:00:01.000Z",
    });

    const candidate = closure.candidates.find(
      (entry) => entry.candidateId === COMPARISON_BADGE_ID,
    );
    expect(candidate).toMatchObject({
      comparable: false,
      bridgeStatuses: ["verified"],
    });
    expect(candidate?.comparabilityBlockers).toContain(
      "candidate_context_path_missing",
    );
    expect(candidate?.comparabilityBlockers).not.toContain(
      "registered_bridge_status_missing",
    );
    expect(
      candidate?.axes.find((entry) => entry.axisId === "graph_congruence"),
    ).toMatchObject({ status: "blocked" });
    expect(closure.ranking.topCandidateIds).not.toContain(COMPARISON_BADGE_ID);
  });

  it("treats an empty candidate bridge-status set as a blocked comparison path", async () => {
    const procedure = await buildProcedure();
    addSyntheticComparison(procedure);
    const closure = await compileTheoryExperimentExecutionClosureV1({
      procedure,
      procedureArtifactRef: `${TURN_ID}:procedure-artifact`,
      evidenceObservations: [
        evidence(
          "semantic_admission",
          `${TURN_ID}:semantic`,
          "admitted",
          true,
          "a".repeat(64),
        ),
      ],
      generatedAt: "2026-07-26T12:00:01.000Z",
    });

    const candidate = closure.candidates.find(
      (entry) => entry.candidateId === COMPARISON_BADGE_ID,
    );
    expect(candidate).toMatchObject({
      comparable: false,
      bridgeStatuses: [],
    });
    expect(candidate?.comparabilityBlockers).toEqual(
      expect.arrayContaining([
        "registered_bridge_status_missing",
        "candidate_context_path_missing",
      ]),
    );
    expect(candidate?.comparabilityBlockers).not.toContain(
      "candidate_derivation_path_not_admitted",
    );
  });

  it("requires candidate-specific derivation participation before ranking", async () => {
    const procedure = await buildProcedure();
    const candidateStepIds = new Set(
      procedure.derivationProgram.steps
        .filter(
          (step) =>
            step.kind !== "assemble_solver_input" &&
            step.sourceNodeIds.some((nodeId) =>
              procedure.masterProblem.nodes.some(
                (node) => node.id === nodeId && node.badgeId === BADGE_ID,
              ),
            ),
        )
        .map((step) => step.id),
    );
    const assembleStep = procedure.derivationProgram.steps.find(
      (step) => step.kind === "assemble_solver_input",
    );
    if (!assembleStep || candidateStepIds.size === 0) {
      throw new Error(
        "derivation-path fixture requires candidate and assembly steps",
      );
    }
    assembleStep.dependsOnStepIds = assembleStep.dependsOnStepIds.filter(
      (stepId) => !candidateStepIds.has(stepId),
    );
    const closure = await compileTheoryExperimentExecutionClosureV1({
      procedure,
      procedureArtifactRef: `${TURN_ID}:procedure-artifact`,
      evidenceObservations: [
        evidence(
          "semantic_admission",
          `${TURN_ID}:semantic`,
          "admitted",
          true,
          "a".repeat(64),
        ),
      ],
      generatedAt: "2026-07-26T12:00:01.000Z",
    });

    expect(closure.candidates[0]).toMatchObject({
      comparable: false,
      comparabilityBlockers: ["candidate_derivation_path_not_admitted"],
    });
    expect(
      closure.candidates[0].axes.find(
        (entry) => entry.axisId === "derivation_readiness",
      ),
    ).toMatchObject({ status: "blocked" });
    expect(closure.ranking.outcome).toBe("incomparable");
  });
});
