import { computeCasimirSpecValueSha256V1 } from "../../../shared/contracts/casimir-spec-scientific-claim-ir.v1";
import {
  validateScientificEvidenceExecutionPlanIntegrityV1,
  type ScientificEvidenceExecutionPlanV1,
} from "../../../shared/contracts/scientific-evidence-execution-plan.v1";
import {
  ADVECTION_DIFFUSION_BASELINE_CASE_ID,
  ADVECTION_DIFFUSION_INDEPENDENT_LINEAGE_ID,
  ADVECTION_DIFFUSION_INTERVENTION_CASE_ID,
  ADVECTION_DIFFUSION_PRIMARY_LINEAGE_ID,
  buildAdvectionDiffusionScientificEvidenceEnrollmentV1,
} from "../../../shared/scientific-evidence/advection-diffusion-scientific-evidence-enrollment";
import {
  ADVECTION_DIFFUSION_LEAN_KERNEL_SHA256,
  ADVECTION_DIFFUSION_OBSERVED_THEOREM_TYPE_SHA256,
  buildAdvectionDiffusionZeroGradientLeanBindingV1,
} from "../../../shared/scientific-evidence/advection-diffusion-zero-gradient-lean-binding";
import {
  SCIENTIFIC_EVIDENCE_CLOSURE_INPUT_HASH_DOMAIN,
  SCIENTIFIC_EVIDENCE_CLOSURE_INPUT_KIND,
  SCIENTIFIC_EVIDENCE_CLOSURE_INPUT_SCHEMA,
} from "../helix-ask/workstation-tool-gateway/scientific-evidence-closure";
import type { EvaluateScientificEvidenceClosureV1Input } from "./scientific-evidence-closure-evaluator";

export const SCIENTIFIC_EVIDENCE_CLOSURE_INPUT_SOURCE_CAPABILITY =
  "codex-runtime.scientific-evidence-closure-input" as const;

/**
 * Materializes the already-observed workstation smoke data as an explicitly
 * blocked diagnostic input. It is useful for re-entry and presentation tests,
 * but it cannot become canonical because no current production sandbox or
 * trusted single-use confirmation bundle is asserted.
 */
export async function buildAdvectionDiffusionHostDiagnosticClosureInputV1(
  input: {
    turnId: string;
    executionPlan: ScientificEvidenceExecutionPlanV1;
    artifactRef?: string;
  },
): Promise<Record<string, unknown>> {
  const enrollment =
    await buildAdvectionDiffusionScientificEvidenceEnrollmentV1();
  const binding =
    await buildAdvectionDiffusionZeroGradientLeanBindingV1();
  const executionPlan = structuredClone(input.executionPlan);
  const executionPlanIssues =
    await validateScientificEvidenceExecutionPlanIntegrityV1(
      executionPlan,
    );
  if (executionPlanIssues.length > 0) {
    throw new Error("scientific_evidence_execution_plan_integrity_invalid");
  }
  if (
    executionPlan.turnBinding.turnId !== input.turnId ||
    executionPlan.enrollment.manifestId !==
      enrollment.manifest.manifestId ||
    executionPlan.enrollment.manifestArtifactSha256 !==
      enrollment.manifest.artifactSha256 ||
    executionPlan.intervention.selectedValue !== "0.02"
  ) {
    throw new Error("scientific_evidence_execution_plan_binding_mismatch");
  }
  const semanticBundle = {
    formalSpecArtifactSha256:
      enrollment.manifest.semanticBindings.formalCasimirSpec.artifactSha256,
    numericalSpecArtifactSha256:
      enrollment.manifest.semanticBindings.numericalCasimirSpec.artifactSha256,
    semanticToLeanBindingArtifactSha256:
      binding.binding.artifactSha256,
    reviewed: true,
  };
  const semanticBundleSha256 = await computeCasimirSpecValueSha256V1({
    domain: "scientific-semantic-binding-bundle/v1",
    value: {
      artifactId: "scientific_semantic_binding_bundle",
      schemaVersion: "scientific_semantic_binding_bundle/v1",
      ...semanticBundle,
    },
  });
  const comparisonPolicy = {
    policyId: "policy:advection-diffusion-congruence:v1",
    maximumCrossLaneL2: 0.01,
    minimumObservedOrder: 0.8,
    maximumInterventionDeltaDiscrepancy: 0.00001,
  };
  const comparisonPolicySha256 =
    await computeCasimirSpecValueSha256V1({
      domain: "scientific-evidence-comparison-policy/v1",
      value: comparisonPolicy,
    });
  const confirmationArtifactSha256 =
    await computeCasimirSpecValueSha256V1({
      domain: "scientific-evidence-host-diagnostic-confirmation/v1",
      value: {
        planId: executionPlan.planId,
        turnId: input.turnId,
        manifestArtifactSha256: enrollment.manifest.artifactSha256,
        executionPlanArtifactSha256:
          executionPlan.artifactSha256,
        status: "not_issued",
      },
    });
  const formalArtifactSha256 = await computeCasimirSpecValueSha256V1({
    domain: "scientific-evidence-host-formal-diagnostic/v1",
    value: {
      theoremName: enrollment.manifest.formalContract.theoremName,
      theoremTypeSha256:
        ADVECTION_DIFFUSION_OBSERVED_THEOREM_TYPE_SHA256,
      leanKernelSha256: ADVECTION_DIFFUSION_LEAN_KERNEL_SHA256,
      completedReplayCount: 2,
      executionScope: "host_workstation_smoke",
      productionSandboxEnforced: false,
    },
  });
  const numericalArtifactSha256 = async (value: Record<string, unknown>) =>
    computeCasimirSpecValueSha256V1({
      domain: "scientific-evidence-host-numerical-diagnostic/v1",
      value,
    });
  const baselineNumericalValues = {
    caseId: ADVECTION_DIFFUSION_BASELINE_CASE_ID,
    primaryExecutableSha256:
      "4fee80d86fa4e2dd14183f5f697319b8c453523ffdf5aef953bd2d04abe80c8b",
    independentExecutableSha256:
      "54747b1ec472a3fef188f1138b9c92c029e05a0f1a225d215238b308f29e87cb",
    primaryFundamentalAmplitude: 0.2446598675387153,
    independentFundamentalAmplitude: 0.2451138257827937,
    finestCrossLaneL2: 0.00032101696822587554,
    minimumObservedOrder: 0.8805421143420913,
  };
  const interventionNumericalValues = {
    caseId: ADVECTION_DIFFUSION_INTERVENTION_CASE_ID,
    primaryExecutableSha256:
      "f6e7d5e839084115fed95aa3d4bf8094766ff07eb923082c1555297d5e96b5dc",
    independentExecutableSha256:
      "d5de01cf3798aca5a31b401c84154ea016e80d21473c4079fceaf5f20b303b96",
    primaryFundamentalAmplitude: 0.23986875842621713,
    independentFundamentalAmplitude: 0.24032315117489741,
    finestCrossLaneL2: 0.00032132181655600826,
    minimumObservedOrder: 0.9457714843076647,
  };
  const baselineArtifactSha256 = await numericalArtifactSha256(
    baselineNumericalValues,
  );
  const interventionArtifactSha256 = await numericalArtifactSha256(
    interventionNumericalValues,
  );
  const numericalObservation = (
    values:
      | typeof baselineNumericalValues
      | typeof interventionNumericalValues,
    artifactSha256: string,
  ) => ({
    artifactId: "scientific_evidence_host_numerical_diagnostic",
    schemaVersion: "scientific_evidence_host_numerical_diagnostic/v1",
    artifactSha256,
    currentTurnId: input.turnId,
    status: "blocked" as const,
    manifestArtifactSha256: enrollment.manifest.artifactSha256,
    caseId: values.caseId,
    primaryLineageId: ADVECTION_DIFFUSION_PRIMARY_LINEAGE_ID,
    independentLineageId:
      ADVECTION_DIFFUSION_INDEPENDENT_LINEAGE_ID,
    independenceEstablished: true,
    replayCount: 2,
    refinementLevels: 3,
    productionSandboxEnforced: false,
    primaryFundamentalAmplitude: values.primaryFundamentalAmplitude,
    independentFundamentalAmplitude:
      values.independentFundamentalAmplitude,
    finestCrossLaneL2: values.finestCrossLaneL2,
    minimumObservedOrder: values.minimumObservedOrder,
  });

  const closureInput: Omit<
    EvaluateScientificEvidenceClosureV1Input,
    "enrollment"
  > = {
    generatedAt: "2026-07-30T12:00:00.000Z",
    packetId: `${executionPlan.planId}:closure-packet`,
    turnId: input.turnId,
    planId: executionPlan.planId,
    executionPlan,
    confirmation: {
      artifactSha256: confirmationArtifactSha256,
      turnId: input.turnId,
      planId: executionPlan.planId,
      manifestArtifactSha256: enrollment.manifest.artifactSha256,
      executionPlanArtifactSha256:
        executionPlan.artifactSha256,
      consumedExactlyOnce: false,
    },
    sourceClaim: {
      ...enrollment.sourceClaim,
      currentTurnId: input.turnId,
    },
    semanticBinding: {
      artifactId: "scientific_semantic_binding_bundle",
      schemaVersion: "scientific_semantic_binding_bundle/v1",
      artifactSha256: semanticBundleSha256,
      currentTurnId: input.turnId,
      ...semanticBundle,
    },
    graphSnapshot: {
      ...enrollment.graphSnapshot,
      currentTurnId: input.turnId,
    },
    formal: {
      artifactId: "scientific_evidence_host_formal_diagnostic",
      schemaVersion: "scientific_evidence_host_formal_diagnostic/v1",
      artifactSha256: formalArtifactSha256,
      currentTurnId: input.turnId,
      status: "blocked",
      manifestArtifactSha256: enrollment.manifest.artifactSha256,
      theoremName: enrollment.manifest.formalContract.theoremName,
      theoremTypeSha256:
        ADVECTION_DIFFUSION_OBSERVED_THEOREM_TYPE_SHA256,
      replayCount: 2,
      productionSandboxEnforced: false,
    },
    baselineNumerical: numericalObservation(
      baselineNumericalValues,
      baselineArtifactSha256,
    ),
    interventionNumerical: numericalObservation(
      interventionNumericalValues,
      interventionArtifactSha256,
    ),
    comparisonPolicy: {
      ...comparisonPolicy,
      policySha256: comparisonPolicySha256,
    },
  };
  const payload = {
    schema: SCIENTIFIC_EVIDENCE_CLOSURE_INPUT_SCHEMA,
    current_turn_id: input.turnId,
    closure_input: closureInput,
    authority: {
      runtimeObservationBundle: true,
      hostDiagnosticOnly: true,
      productionSandboxEvidence: false,
      assistantAnswer: false,
      terminalEligible: false,
    },
  };
  const contentSha256 = await computeCasimirSpecValueSha256V1({
    domain: SCIENTIFIC_EVIDENCE_CLOSURE_INPUT_HASH_DOMAIN,
    value: payload,
  });
  return {
    schema: "helix.current_turn_artifact.v1",
    artifact_id:
      input.artifactRef ??
      `${input.turnId}:codex_runtime:scientific_evidence_closure_input`,
    kind: SCIENTIFIC_EVIDENCE_CLOSURE_INPUT_KIND,
    observation_kind: SCIENTIFIC_EVIDENCE_CLOSURE_INPUT_KIND,
    payload_schema: SCIENTIFIC_EVIDENCE_CLOSURE_INPUT_SCHEMA,
    content_sha256: contentSha256,
    turn_id: input.turnId,
    source_scope: "current_turn_context",
    capability_key:
      SCIENTIFIC_EVIDENCE_CLOSURE_INPUT_SOURCE_CAPABILITY,
    source_capability_id:
      SCIENTIFIC_EVIDENCE_CLOSURE_INPUT_SOURCE_CAPABILITY,
    status: "blocked",
    payload,
    post_tool_model_step_required: true,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
}
