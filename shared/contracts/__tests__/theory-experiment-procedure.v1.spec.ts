import { beforeAll, describe, expect, it } from "vitest";

import {
  validateTheoryExperimentProcedureV1,
  type TheoryExperimentEvidenceBindingV1,
  type TheoryExperimentProcedureV1,
} from "../theory-experiment-procedure.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../../theory/nhm2-theory-badges";
import { buildTheoryContextReflection } from "../../theory/theory-context-reflector";
import { compileTheoryExperimentProcedureV1 } from "../../theory/theory-experiment-procedure-compiler";

const TURN_ID = "ask:test:procedure-contract";
const BADGE_ID = "study.casimir_dp.evidence_map_stage3";

const semanticBinding = (
  graphId: string,
): TheoryExperimentEvidenceBindingV1 => ({
  artifactRef: "semantic-admission:contract",
  kind: "semantic_admission",
  schema: "casimir_spec_semantic_admission_receipt/v1",
  sourceTurnId: TURN_ID,
  admissionTurnId: TURN_ID,
  contentSha256: "a".repeat(64),
  admission: "current_turn_admitted",
  lineage: {
    sourceKind: "semantic_claim_ir",
    procedureId: "procedure:test:contract-validator",
    candidateBadgeIds: [BADGE_ID],
    casimirSpecId: "casimir-spec:test:contract-validator",
    casimirSpecSemanticSha256: "b".repeat(64),
    casimirSpecArtifactSha256: "c".repeat(64),
    claims: [
      {
        claimId: "claim:test:contract-validator",
        propositionSha256: "d".repeat(64),
        observableIds: ["concentration_field"],
      },
    ],
    sourceGraphId: graphId,
    sourceGraphSnapshotSha256: "e".repeat(64),
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

type MutableProcedure = Record<string, any>;

describe("theory_experiment_procedure/v1 validator", () => {
  let validProcedure: TheoryExperimentProcedureV1;

  beforeAll(async () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const reflection = buildTheoryContextReflection({
      graph,
      prompt:
        "Compare the Stage 3 evidence map with the pinned one-dimensional advection-diffusion case.",
      mentionedDomains: [BADGE_ID],
      generatedAt: "2026-07-25T00:00:00.000Z",
      reflectionId: "reflection:test:procedure-contract",
    });
    validProcedure = await compileTheoryExperimentProcedureV1({
      graph,
      turnId: TURN_ID,
      procedureId: "procedure:test:contract-validator",
      generatedAt: "2026-07-25T00:00:00.000Z",
      reflection,
      request: {
        operation: "compare",
        target: "one-dimensional periodic advection diffusion",
        targetObservable: "concentration_field",
        scaleLog10M: { min: -3, max: 0 },
        coordinateFrame: "laboratory",
        initialBoundaryConditions: [
          "periodic domain",
          "sinusoidal initial concentration",
        ],
        formalSystem: "Lean 4",
        requestedPrecision: "1e-3",
        evidenceMaturityCeiling: "diagnostic",
        normalizationStatus: "explicit",
      },
      selectedBadgeIds: [BADGE_ID],
      evidenceBindings: [semanticBinding(graph.graphId)],
      lanyon: {
        requested: true,
        caseId: "advection_diffusion_full_1d",
      },
    });
    expect(validateTheoryExperimentProcedureV1(validProcedure)).toEqual([]);
  });

  const adversarialCases: Array<{
    name: string;
    mutate: (procedure: MutableProcedure) => void;
    expectedIssue: string;
  }> = [
    {
      name: "rejects a missing evidence artifact reference",
      mutate: (procedure) => {
        delete procedure.evidenceBindings[0].artifactRef;
      },
      expectedIssue: "evidenceBindings[0].artifactRef",
    },
    {
      name: "rejects a missing evidence schema",
      mutate: (procedure) => {
        delete procedure.evidenceBindings[0].schema;
      },
      expectedIssue: "evidenceBindings[0].schema",
    },
    {
      name: "rejects a missing evidence source turn",
      mutate: (procedure) => {
        delete procedure.evidenceBindings[0].sourceTurnId;
      },
      expectedIssue: "evidenceBindings[0].sourceTurnId",
    },
    {
      name: "rejects an unknown evidence kind",
      mutate: (procedure) => {
        procedure.evidenceBindings[0].kind = "solver_answer";
      },
      expectedIssue: "evidenceBindings[0].kind is invalid",
    },
    {
      name: "rejects a missing evidence admission turn",
      mutate: (procedure) => {
        delete procedure.evidenceBindings[0].admissionTurnId;
      },
      expectedIssue: "evidenceBindings[0].admissionTurnId",
    },
    {
      name: "rejects a malformed evidence content hash",
      mutate: (procedure) => {
        procedure.evidenceBindings[0].contentSha256 = "not-a-sha256";
      },
      expectedIssue: "evidenceBindings[0].contentSha256 is invalid",
    },
    {
      name: "rejects an unknown evidence admission mode",
      mutate: (procedure) => {
        procedure.evidenceBindings[0].admission = "copied_from_history";
      },
      expectedIssue: "evidenceBindings[0].admission is invalid",
    },
    {
      name: "rejects missing evidence-only authority",
      mutate: (procedure) => {
        delete procedure.evidenceBindings[0].authority;
      },
      expectedIssue: "evidenceBindings[0] exceeds evidence authority",
    },
    {
      name: "rejects answer-authority elevation on evidence",
      mutate: (procedure) => {
        procedure.evidenceBindings[0].assistantAnswer = true;
      },
      expectedIssue: "evidenceBindings[0] exceeds evidence authority",
    },
    {
      name: "rejects terminal-authority elevation on evidence",
      mutate: (procedure) => {
        procedure.evidenceBindings[0].terminalEligible = true;
      },
      expectedIssue: "evidenceBindings[0] exceeds evidence authority",
    },
    {
      name: "rejects an invalid request operation",
      mutate: (procedure) => {
        procedure.request.operation = "simulate";
      },
      expectedIssue: "request.operation is invalid",
    },
    {
      name: "rejects overlap between selected and comparison badge sets",
      mutate: (procedure) => {
        procedure.request.comparisonBadgeIds = [
          procedure.request.selectedBadgeIds[0],
        ];
      },
      expectedIssue: "selected_comparison_badge_id_overlap",
    },
    {
      name: "rejects a missing reflection claim-boundary list",
      mutate: (procedure) => {
        delete procedure.reflection.claimBoundaries;
      },
      expectedIssue: "reflection.claimBoundaries",
    },
    {
      name: "rejects malformed dependency-order step identities",
      mutate: (procedure) => {
        procedure.dependencyOrder.stepIds = [""];
      },
      expectedIssue: "dependencyOrder.stepIds",
    },
    {
      name: "rejects a missing scale-envelope shape",
      mutate: (procedure) => {
        procedure.scaleCheckpoints.push({
          badgeId: BADGE_ID,
          scaleBand: "laboratory",
          scaleLog10M: null,
          coordinateFrame: null,
          validityDomainRefs: [],
          dependencyOrdinal: 0,
          orderAuthority: "dependency_dag",
          interpretation: "scale_checkpoint_not_execution_order",
        });
      },
      expectedIssue: "scaleCheckpoints[0].scaleEnvelope",
    },
    {
      name: "rejects a missing Lanyon requested flag",
      mutate: (procedure) => {
        delete procedure.lanyonEligibility.requested;
      },
      expectedIssue: "lanyonEligibility.requested must be boolean",
    },
    {
      name: "rejects elevated Lanyon authority",
      mutate: (procedure) => {
        procedure.lanyonEligibility.authority.trustsProducerOutput = true;
      },
      expectedIssue: "lanyonEligibility.authority is invalid",
    },
    {
      name: "rejects an unknown capability phase",
      mutate: (procedure) => {
        procedure.capabilityAffordances[0].phase = "execute";
      },
      expectedIssue: "capabilityAffordances[0].phase is invalid",
    },
    {
      name: "rejects a missing capability confirmation policy",
      mutate: (procedure) => {
        delete procedure.capabilityAffordances[0].requiresConfirmation;
      },
      expectedIssue:
        "capabilityAffordances[0].requiresConfirmation must be boolean",
    },
    {
      name: "rejects a capability claiming an unknown evidence kind",
      mutate: (procedure) => {
        procedure.capabilityAffordances[0].producesEvidenceKind =
          "solver_answer";
      },
      expectedIssue: "capabilityAffordances[0].producesEvidenceKind is invalid",
    },
    {
      name: "rejects an unknown missing-requirement repair",
      mutate: (procedure) => {
        procedure.missingRequirements[0].repair = "run_private_loop";
      },
      expectedIssue: "missingRequirements[0].repair is invalid",
    },
    {
      name: "rejects a non-canonical stage status",
      mutate: (procedure) => {
        procedure.stages[0].status = "verified";
      },
      expectedIssue: "stages[0].status is invalid",
    },
    {
      name: "rejects a missing stage capability list",
      mutate: (procedure) => {
        delete procedure.stages[0].capabilityIds;
      },
      expectedIssue: "stages[0].capabilityIds",
    },
    {
      name: "preserves exact seven-stage order validation",
      mutate: (procedure) => {
        [procedure.stages[0], procedure.stages[1]] = [
          procedure.stages[1],
          procedure.stages[0],
        ];
      },
      expectedIssue: "must preserve canonical stage order",
    },
    {
      name: "rejects an unknown readiness status",
      mutate: (procedure) => {
        procedure.readiness.status = "complete";
      },
      expectedIssue: "readiness.status is invalid",
    },
    {
      name: "rejects a missing readiness reason",
      mutate: (procedure) => {
        delete procedure.readiness.reason;
      },
      expectedIssue: "readiness.reason",
    },
    {
      name: "rejects an unknown incompleteness formal status",
      mutate: (procedure) => {
        procedure.incompletenessBoundary.formalStatus = "proved_complete";
      },
      expectedIssue: "incompletenessBoundary.formalStatus is invalid",
    },
    {
      name: "rejects missing proof-authority denial",
      mutate: (procedure) => {
        delete procedure.authority.proofAuthority;
      },
      expectedIssue: "authority boundary is invalid",
    },
    {
      name: "preserves lowercase exact-length hash validation",
      mutate: (procedure) => {
        procedure.procedureSha256 = "A".repeat(64);
      },
      expectedIssue: "procedureSha256 must be lowercase SHA-256",
    },
  ];

  it.each(adversarialCases)("$name", ({ mutate, expectedIssue }) => {
    const candidate = structuredClone(validProcedure) as MutableProcedure;
    mutate(candidate);

    expect(validateTheoryExperimentProcedureV1(candidate)).toEqual(
      expect.arrayContaining([expect.stringContaining(expectedIssue)]),
    );
  });
});
