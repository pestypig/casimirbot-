import {
  SCIENTIFIC_EVIDENCE_CLOSURE_AXES,
  buildScientificEvidenceClosurePacketV1,
  type ScientificEvidenceClosurePacketV1,
} from "../../../shared/contracts/scientific-evidence-closure-packet.v1";
import {
  validateScientificEvidenceConformanceManifestV1,
  type ScientificEvidenceConformanceManifestV1,
} from "../../../shared/contracts/scientific-evidence-conformance-manifest.v1";
import { computeCasimirSpecValueSha256V1 } from "../../../shared/contracts/casimir-spec-scientific-claim-ir.v1";
import {
  validateScientificEvidenceExecutionPlanIntegrityV1,
  type ScientificEvidenceExecutionPlanV1,
} from "../../../shared/contracts/scientific-evidence-execution-plan.v1";

type EvidenceStatus = "passed" | "failed" | "blocked";
type EvidenceRef = {
  artifactId: string;
  schemaVersion: string;
  artifactSha256: string;
};
type TurnEvidence = EvidenceRef & {
  currentTurnId: string;
};

export type ScientificEvidenceClosureEnrollmentV1 = {
  manifest: ScientificEvidenceConformanceManifestV1;
  sourceClaimArtifactSha256: string;
  graphSnapshotArtifactSha256: string;
  semanticToLeanBindingArtifactSha256: string;
  observedTheoremTypeSha256: string;
};

export type ScientificEvidenceFormalObservationV1 = TurnEvidence & {
  status: EvidenceStatus;
  manifestArtifactSha256: string;
  theoremName: string;
  theoremTypeSha256: string;
  replayCount: number;
  productionSandboxEnforced: boolean;
};

export type ScientificEvidenceNumericalObservationV1 = TurnEvidence & {
  status: EvidenceStatus;
  manifestArtifactSha256: string;
  caseId: string;
  primaryLineageId: string;
  independentLineageId: string;
  independenceEstablished: boolean;
  replayCount: number;
  refinementLevels: number;
  productionSandboxEnforced: boolean;
  primaryFundamentalAmplitude: number;
  independentFundamentalAmplitude: number;
  finestCrossLaneL2: number;
  minimumObservedOrder: number;
};

export type EvaluateScientificEvidenceClosureV1Input = {
  generatedAt?: string;
  packetId: string;
  turnId: string;
  planId: string;
  executionPlan: ScientificEvidenceExecutionPlanV1;
  confirmation: {
    artifactSha256: string;
    turnId: string;
    planId: string;
    manifestArtifactSha256: string;
    executionPlanArtifactSha256: string;
    consumedExactlyOnce: boolean;
  };
  enrollment: ScientificEvidenceClosureEnrollmentV1;
  sourceClaim: TurnEvidence & {
    sourceClaimId: string;
    extractedStatementSha256: string;
  };
  semanticBinding: TurnEvidence & {
    formalSpecArtifactSha256: string;
    numericalSpecArtifactSha256: string;
    semanticToLeanBindingArtifactSha256: string;
    reviewed: boolean;
  };
  graphSnapshot: TurnEvidence & {
    graphId: string;
    badgeIds: string[];
    edgeIds: string[];
  };
  formal: ScientificEvidenceFormalObservationV1;
  baselineNumerical: ScientificEvidenceNumericalObservationV1;
  interventionNumerical: ScientificEvidenceNumericalObservationV1;
  comparisonPolicy: {
    policyId: string;
    policySha256: string;
    maximumCrossLaneL2: number;
    minimumObservedOrder: number;
    maximumInterventionDeltaDiscrepancy: number;
  };
};

type AxisState = {
  status: EvidenceStatus;
  evidenceSha256: string | null;
  issueCodes: string[];
};

const SHA256 = /^[a-f0-9]{64}$/;
const uniqueSorted = (values: string[]) => [...new Set(values)].sort();
const exactArray = (left: readonly string[], right: readonly string[]) =>
  JSON.stringify(left) === JSON.stringify(right);
const finite = (value: number) => Number.isFinite(value);

const decideAxis = (
  evidenceSha256: string | null,
  failed: string[],
  blocked: string[],
): AxisState => ({
  status:
    failed.length > 0 ? "failed" : blocked.length > 0 ? "blocked" : "passed",
  evidenceSha256,
  issueCodes: uniqueSorted([...failed, ...blocked]),
});

const turnIssue = (observed: string, expected: string): string[] =>
  observed === expected ? [] : ["stale_or_foreign_turn_evidence"];

export async function evaluateScientificEvidenceClosureV1(
  input: EvaluateScientificEvidenceClosureV1Input,
): Promise<ScientificEvidenceClosurePacketV1> {
  const manifest = input.enrollment.manifest;
  const [manifestIssues, executionPlanIntegrityIssues] =
    await Promise.all([
      validateScientificEvidenceConformanceManifestV1(manifest),
      validateScientificEvidenceExecutionPlanIntegrityV1(
        input.executionPlan,
      ),
    ]);
  const executionPlanFailed = [
    ...executionPlanIntegrityIssues.map(
      () => "execution_plan_integrity_invalid",
    ),
    ...(input.executionPlan.turnBinding.turnId === input.turnId
      ? []
      : ["execution_plan_turn_mismatch"]),
    ...(input.executionPlan.planId === input.planId
      ? []
      : ["execution_plan_id_mismatch"]),
    ...(input.executionPlan.enrollment.manifestId === manifest.manifestId
      ? []
      : ["execution_plan_manifest_id_mismatch"]),
    ...(input.executionPlan.enrollment.manifestArtifactSha256 ===
    manifest.artifactSha256
      ? []
      : ["execution_plan_manifest_hash_mismatch"]),
    ...(input.executionPlan.selection.orientationId ===
    manifest.orientation.orientationId
      ? []
      : ["execution_plan_orientation_mismatch"]),
    ...(input.executionPlan.selection.sourceClaimId ===
    manifest.sourceClaim.sourceClaimId
      ? []
      : ["execution_plan_source_claim_mismatch"]),
    ...(input.executionPlan.selection.sourceClaimArtifactSha256 ===
    input.enrollment.sourceClaimArtifactSha256
      ? []
      : ["execution_plan_source_claim_hash_mismatch"]),
    ...(exactArray(
      input.executionPlan.selection.selectedBadgeIds,
      manifest.orientation.selectedBadgeIds,
    )
      ? []
      : ["execution_plan_badge_selection_mismatch"]),
    ...(input.executionPlan.intervention.parameterId ===
    manifest.parameterPolicy.mutableParameterId
      ? []
      : ["execution_plan_intervention_parameter_mismatch"]),
    ...(input.executionPlan.intervention.baselineValue ===
    manifest.parameterPolicy.baselineValue
      ? []
      : ["execution_plan_baseline_value_mismatch"]),
    ...(manifest.parameterPolicy.permittedValues.includes(
      input.executionPlan.intervention.selectedValue,
    )
      ? []
      : ["execution_plan_intervention_value_not_permitted"]),
    ...(input.executionPlan.intervention.selectedValue !==
    manifest.parameterPolicy.baselineValue
      ? []
      : ["execution_plan_intervention_not_modified"]),
  ];
  const confirmationFailed = [
    ...(input.confirmation.turnId === input.turnId
      ? []
      : ["confirmation_turn_mismatch"]),
    ...(input.confirmation.planId === input.planId
      ? []
      : ["confirmation_plan_mismatch"]),
    ...(input.confirmation.manifestArtifactSha256 ===
    manifest.artifactSha256
      ? []
      : ["confirmation_manifest_mismatch"]),
    ...(input.confirmation.executionPlanArtifactSha256 ===
    input.executionPlan.artifactSha256
      ? []
      : ["confirmation_execution_plan_mismatch"]),
    ...(SHA256.test(input.confirmation.artifactSha256)
      ? []
      : ["confirmation_receipt_hash_invalid"]),
  ];
  const confirmationBlocked = input.confirmation.consumedExactlyOnce
    ? []
    : ["confirmation_not_single_use"];

  const sourceFailed = [
    ...(input.sourceClaim.sourceClaimId === manifest.sourceClaim.sourceClaimId
      ? []
      : ["source_claim_id_mismatch"]),
    ...(input.sourceClaim.artifactSha256 ===
    input.enrollment.sourceClaimArtifactSha256
      ? []
      : ["source_claim_hash_mismatch"]),
    ...(input.sourceClaim.extractedStatementSha256 ===
    manifest.sourceClaim.extraction.extractedStatementSha256
      ? []
      : ["source_extraction_hash_mismatch"]),
    ...turnIssue(input.sourceClaim.currentTurnId, input.turnId),
  ];
  const sourceAxis = decideAxis(
    input.sourceClaim.artifactSha256,
    sourceFailed,
    [],
  );

  const semanticFailed = [
    ...(input.semanticBinding.formalSpecArtifactSha256 ===
    manifest.semanticBindings.formalCasimirSpec.artifactSha256
      ? []
      : ["formal_semantic_artifact_mismatch"]),
    ...(input.semanticBinding.numericalSpecArtifactSha256 ===
    manifest.semanticBindings.numericalCasimirSpec.artifactSha256
      ? []
      : ["numerical_semantic_artifact_mismatch"]),
    ...(input.semanticBinding.semanticToLeanBindingArtifactSha256 ===
    input.enrollment.semanticToLeanBindingArtifactSha256
      ? []
      : ["semantic_to_lean_binding_mismatch"]),
    ...(input.semanticBinding.reviewed
      ? []
      : ["semantic_to_lean_binding_not_reviewed"]),
    ...turnIssue(input.semanticBinding.currentTurnId, input.turnId),
  ];
  const semanticAxis = decideAxis(
    input.semanticBinding.artifactSha256,
    semanticFailed,
    [],
  );

  const graphFailed = [
    ...(input.graphSnapshot.graphId === manifest.orientation.graphId
      ? []
      : ["graph_id_mismatch"]),
    ...(input.graphSnapshot.artifactSha256 ===
    input.enrollment.graphSnapshotArtifactSha256
      ? []
      : ["graph_snapshot_hash_mismatch"]),
    ...(exactArray(
      input.graphSnapshot.badgeIds,
      manifest.orientation.selectedBadgeIds,
    )
      ? []
      : ["graph_badge_orientation_mismatch"]),
    ...(exactArray(
      input.graphSnapshot.edgeIds,
      manifest.orientation.orderedEdgeIds,
    )
      ? []
      : ["graph_edge_orientation_mismatch"]),
    ...turnIssue(input.graphSnapshot.currentTurnId, input.turnId),
  ];
  const graphAxis = decideAxis(
    input.graphSnapshot.artifactSha256,
    graphFailed,
    [],
  );

  const formalFailed = [
    ...(input.formal.manifestArtifactSha256 === manifest.artifactSha256
      ? []
      : ["formal_manifest_mismatch"]),
    ...(input.formal.theoremName === manifest.formalContract.theoremName
      ? []
      : ["formal_theorem_name_mismatch"]),
    ...(input.formal.theoremTypeSha256 ===
    input.enrollment.observedTheoremTypeSha256
      ? []
      : ["formal_theorem_type_mismatch"]),
    ...(input.formal.replayCount === manifest.numericalContract.replayCount
      ? []
      : ["formal_replay_count_mismatch"]),
    ...turnIssue(input.formal.currentTurnId, input.turnId),
    ...(input.formal.status === "failed" ? ["formal_replay_failed"] : []),
  ];
  const formalBlocked = [
    ...(input.formal.status === "blocked"
      ? ["formal_replay_blocked"]
      : []),
    ...(input.formal.productionSandboxEnforced
      ? []
      : ["formal_production_sandbox_not_enforced"]),
  ];
  const formalAxis = decideAxis(
    input.formal.artifactSha256,
    formalFailed,
    formalBlocked,
  );

  const numericalIssues = (
    observation: ScientificEvidenceNumericalObservationV1,
    expectedCaseId: string,
    label: "baseline" | "intervention",
  ) => {
    const failed = [
      ...(observation.manifestArtifactSha256 === manifest.artifactSha256
        ? []
        : [`${label}_numerical_manifest_mismatch`]),
      ...(observation.caseId === expectedCaseId
        ? []
        : [`${label}_numerical_case_mismatch`]),
      ...(observation.primaryLineageId ===
      manifest.numericalContract.primaryLineageId
        ? []
        : [`${label}_primary_lineage_mismatch`]),
      ...(observation.independentLineageId ===
      manifest.numericalContract.independentLineageId
        ? []
        : [`${label}_independent_lineage_mismatch`]),
      ...(observation.replayCount === manifest.numericalContract.replayCount
        ? []
        : [`${label}_replay_count_mismatch`]),
      ...(observation.refinementLevels >=
      manifest.numericalContract.minimumRefinementLevels
        ? []
        : [`${label}_refinement_levels_insufficient`]),
      ...(observation.independenceEstablished
        ? []
        : [`${label}_numerical_independence_not_established`]),
      ...turnIssue(observation.currentTurnId, input.turnId),
      ...(observation.status === "failed"
        ? [`${label}_numerical_execution_failed`]
        : []),
      ...([
        observation.primaryFundamentalAmplitude,
        observation.independentFundamentalAmplitude,
        observation.finestCrossLaneL2,
        observation.minimumObservedOrder,
      ].every(finite)
        ? []
        : [`${label}_numerical_observable_nonfinite`]),
    ];
    const blocked = [
      ...(observation.status === "blocked"
        ? [`${label}_numerical_execution_blocked`]
        : []),
      ...(observation.productionSandboxEnforced
        ? []
        : [`${label}_numerical_production_sandbox_not_enforced`]),
    ];
    return { failed, blocked };
  };
  const baselineIssues = numericalIssues(
    input.baselineNumerical,
    manifest.numericalContract.baselineCaseId,
    "baseline",
  );
  const interventionIssues = numericalIssues(
    input.interventionNumerical,
    manifest.numericalContract.interventionCaseId,
    "intervention",
  );
  const numericalFailed = [
    ...baselineIssues.failed,
    ...interventionIssues.failed,
  ];
  const numericalBlocked = [
    ...baselineIssues.blocked,
    ...interventionIssues.blocked,
  ];
  const numericalAxis = decideAxis(
    await computeCasimirSpecValueSha256V1({
      domain: "scientific-evidence-dual-numerical-observation/v1",
      value: {
        baseline: input.baselineNumerical.artifactSha256,
        intervention: input.interventionNumerical.artifactSha256,
      },
    }),
    numericalFailed,
    numericalBlocked,
  );

  const baselineCrossLaneDelta = Math.abs(
    input.baselineNumerical.primaryFundamentalAmplitude -
      input.baselineNumerical.independentFundamentalAmplitude,
  );
  const interventionCrossLaneDelta = Math.abs(
    input.interventionNumerical.primaryFundamentalAmplitude -
      input.interventionNumerical.independentFundamentalAmplitude,
  );
  const primaryInterventionDelta =
    input.interventionNumerical.primaryFundamentalAmplitude -
    input.baselineNumerical.primaryFundamentalAmplitude;
  const independentInterventionDelta =
    input.interventionNumerical.independentFundamentalAmplitude -
    input.baselineNumerical.independentFundamentalAmplitude;
  const interventionDeltaDiscrepancy = Math.abs(
    primaryInterventionDelta - independentInterventionDelta,
  );
  const comparisonFailed = [
    ...(input.baselineNumerical.finestCrossLaneL2 <=
    input.comparisonPolicy.maximumCrossLaneL2
      ? []
      : ["baseline_cross_lane_l2_exceeds_policy"]),
    ...(input.interventionNumerical.finestCrossLaneL2 <=
    input.comparisonPolicy.maximumCrossLaneL2
      ? []
      : ["intervention_cross_lane_l2_exceeds_policy"]),
    ...(input.baselineNumerical.minimumObservedOrder >=
    input.comparisonPolicy.minimumObservedOrder
      ? []
      : ["baseline_observed_order_below_policy"]),
    ...(input.interventionNumerical.minimumObservedOrder >=
    input.comparisonPolicy.minimumObservedOrder
      ? []
      : ["intervention_observed_order_below_policy"]),
    ...(interventionDeltaDiscrepancy <=
    input.comparisonPolicy.maximumInterventionDeltaDiscrepancy
      ? []
      : ["intervention_delta_cross_lane_mismatch"]),
  ];
  const comparisonBlocked =
    numericalAxis.status === "blocked"
      ? ["comparison_waiting_for_numerical_closure"]
      : [];
  const comparisonAxis = decideAxis(
    input.comparisonPolicy.policySha256,
    comparisonFailed,
    comparisonBlocked,
  );

  const axes: Record<
    (typeof SCIENTIFIC_EVIDENCE_CLOSURE_AXES)[number],
    AxisState
  > = {
    comparison: comparisonAxis,
    formal: formalAxis,
    graph: graphAxis,
    independent_numerical: numericalAxis,
    semantic: semanticAxis,
    source: sourceAxis,
  };
  const frozenInputsSha256 = await computeCasimirSpecValueSha256V1({
    domain: "scientific-evidence-frozen-inputs/v1",
    value: manifest.parameterPolicy.frozenParameters,
  });
  const executionPlanFrozenInputIssues =
    frozenInputsSha256 ===
    input.executionPlan.intervention.frozenParametersSha256
      ? []
      : ["execution_plan_frozen_inputs_mismatch"];
  const allIssues = uniqueSorted([
    ...manifestIssues.map(() => "conformance_manifest_integrity_invalid"),
    ...executionPlanFailed,
    ...executionPlanFrozenInputIssues,
    ...confirmationFailed,
    ...confirmationBlocked,
    ...Object.values(axes).flatMap((axis) => axis.issueCodes),
  ]);
  const anyFailed =
    manifestIssues.length > 0 ||
    executionPlanFailed.length > 0 ||
    executionPlanFrozenInputIssues.length > 0 ||
    confirmationFailed.length > 0 ||
    Object.values(axes).some((axis) => axis.status === "failed");
  const status: EvidenceStatus =
    anyFailed ? "failed" : allIssues.length > 0 ? "blocked" : "passed";
  const packetStatus =
    status === "passed" ? "satisfied" : status;

  return buildScientificEvidenceClosurePacketV1({
    generatedAt: input.generatedAt,
    packetId: input.packetId,
    status: packetStatus,
    turnBinding: {
      turnId: input.turnId,
      planId: input.planId,
      executionPlanArtifactSha256:
        input.executionPlan.artifactSha256,
      confirmationReceiptSha256: input.confirmation.artifactSha256,
      currentTurnEvidenceReentryRequired: true,
    },
    enrollment: {
      manifestId: manifest.manifestId,
      schemaVersion: manifest.schemaVersion,
      artifactSha256: manifest.artifactSha256,
      orientationId: manifest.orientation.orientationId,
      selectedBadgeIds: [...manifest.orientation.selectedBadgeIds],
    },
    intervention: {
      parameterId: manifest.parameterPolicy.mutableParameterId,
      sourceSymbol: manifest.parameterPolicy.sourceSymbol,
      unit: manifest.parameterPolicy.unit,
      baselineValue: manifest.parameterPolicy.baselineValue,
      interventionValue:
        input.executionPlan.intervention.selectedValue,
      frozenInputsSha256,
    },
    evidence: {
      sourceClaim: {
        artifactId: input.sourceClaim.artifactId,
        schemaVersion: input.sourceClaim.schemaVersion,
        artifactSha256: input.sourceClaim.artifactSha256,
      },
      semanticBinding: {
        artifactId: input.semanticBinding.artifactId,
        schemaVersion: input.semanticBinding.schemaVersion,
        artifactSha256: input.semanticBinding.artifactSha256,
      },
      graphSnapshot: {
        artifactId: input.graphSnapshot.artifactId,
        schemaVersion: input.graphSnapshot.schemaVersion,
        artifactSha256: input.graphSnapshot.artifactSha256,
      },
      formalCertificate: {
        artifactId: input.formal.artifactId,
        schemaVersion: input.formal.schemaVersion,
        artifactSha256: input.formal.artifactSha256,
        status: input.formal.status,
        theoremName: input.formal.theoremName,
        theoremTypeSha256: input.formal.theoremTypeSha256,
      },
      baselineNumericalCertificate: {
        artifactId: input.baselineNumerical.artifactId,
        schemaVersion: input.baselineNumerical.schemaVersion,
        artifactSha256: input.baselineNumerical.artifactSha256,
        status: input.baselineNumerical.status,
        caseId: input.baselineNumerical.caseId,
        primaryLineageId: input.baselineNumerical.primaryLineageId,
        independentLineageId:
          input.baselineNumerical.independentLineageId,
        independenceEstablished:
          input.baselineNumerical.independenceEstablished,
      },
      interventionNumericalCertificate: {
        artifactId: input.interventionNumerical.artifactId,
        schemaVersion: input.interventionNumerical.schemaVersion,
        artifactSha256: input.interventionNumerical.artifactSha256,
        status: input.interventionNumerical.status,
        caseId: input.interventionNumerical.caseId,
        primaryLineageId:
          input.interventionNumerical.primaryLineageId,
        independentLineageId:
          input.interventionNumerical.independentLineageId,
        independenceEstablished:
          input.interventionNumerical.independenceEstablished,
      },
    },
    axisResults: SCIENTIFIC_EVIDENCE_CLOSURE_AXES.map((axis) => ({
      axis,
      status: axes[axis].status,
      evidenceSha256: axes[axis].evidenceSha256,
      issueCodes: axes[axis].issueCodes,
    })),
    comparison: {
      policyId: input.comparisonPolicy.policyId,
      policySha256: input.comparisonPolicy.policySha256,
      observables: [
        {
          observableId: "fundamental_amplitude.primary",
          unit: "1",
          baselineValue:
            input.baselineNumerical.primaryFundamentalAmplitude,
          interventionValue:
            input.interventionNumerical.primaryFundamentalAmplitude,
          delta: primaryInterventionDelta,
          absoluteTolerance:
            input.comparisonPolicy.maximumCrossLaneL2,
          relativeTolerance: 0,
          withinTolerance:
            Math.abs(primaryInterventionDelta) <=
            input.comparisonPolicy.maximumCrossLaneL2,
        },
        {
          observableId: "fundamental_amplitude.independent",
          unit: "1",
          baselineValue:
            input.baselineNumerical.independentFundamentalAmplitude,
          interventionValue:
            input.interventionNumerical.independentFundamentalAmplitude,
          delta: independentInterventionDelta,
          absoluteTolerance:
            input.comparisonPolicy.maximumCrossLaneL2,
          relativeTolerance: 0,
          withinTolerance:
            Math.abs(independentInterventionDelta) <=
            input.comparisonPolicy.maximumCrossLaneL2,
        },
      ],
      gateDeltas: [
        {
          gateId: "cross_lane_l2",
          baselineStatus:
            input.baselineNumerical.finestCrossLaneL2 <=
            input.comparisonPolicy.maximumCrossLaneL2
              ? "passed"
              : "failed",
          interventionStatus:
            input.interventionNumerical.finestCrossLaneL2 <=
            input.comparisonPolicy.maximumCrossLaneL2
              ? "passed"
              : "failed",
          changed:
            (input.baselineNumerical.finestCrossLaneL2 <=
              input.comparisonPolicy.maximumCrossLaneL2) !==
            (input.interventionNumerical.finestCrossLaneL2 <=
              input.comparisonPolicy.maximumCrossLaneL2),
        },
        {
          gateId: "observed_order",
          baselineStatus:
            input.baselineNumerical.minimumObservedOrder >=
            input.comparisonPolicy.minimumObservedOrder
              ? "passed"
              : "failed",
          interventionStatus:
            input.interventionNumerical.minimumObservedOrder >=
            input.comparisonPolicy.minimumObservedOrder
              ? "passed"
              : "failed",
          changed:
            (input.baselineNumerical.minimumObservedOrder >=
              input.comparisonPolicy.minimumObservedOrder) !==
            (input.interventionNumerical.minimumObservedOrder >=
              input.comparisonPolicy.minimumObservedOrder),
        },
      ],
    },
    blockers: allIssues.map((code) => ({
      code,
      message: code.replace(/_/g, " "),
      evidenceSha256: null,
    })),
    claimBoundary: {
      establishes:
        packetStatus === "satisfied"
          ? [
              "The exact enrolled source, semantic bindings, graph orientation, formal contract, and dual numerical observations are congruent for this bounded synthetic intervention.",
              `Changing ${manifest.parameterPolicy.sourceSymbol} from ${manifest.parameterPolicy.baselineValue} to ${
                input.executionPlan.intervention.selectedValue
              } ${manifest.parameterPolicy.unit} changes the primary fundamental amplitude by ${primaryInterventionDelta}.`,
              `The two numerical lanes disagree on that intervention delta by ${interventionDeltaDiscrepancy}.`,
            ]
          : [
              "No scientific closure claim is established while the typed blockers remain.",
            ],
      doesNotEstablish: [
        "It does not establish either numerical implementation correct.",
        "It does not establish measured or empirical evidence.",
        "It does not establish physical truth or a physical mechanism.",
        "It does not prove the complete advection-diffusion model in Lean.",
        "It does not promote a bounded synthetic result beyond the exact enrollment.",
        `The cross-lane amplitude offsets were ${baselineCrossLaneDelta} at baseline and ${interventionCrossLaneDelta} after intervention.`,
      ],
      maximumClaim:
        "bounded synthetic comparison within the exact enrolled case",
    },
  });
}
