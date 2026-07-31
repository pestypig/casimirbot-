import { validateScientificEvidenceClosurePacketIntegrityV1 } from "@shared/contracts/scientific-evidence-closure-packet.v1";
import { computeCasimirSpecValueSha256V1 } from "@shared/contracts/casimir-spec-scientific-claim-ir.v1";
import {
  SCIENTIFIC_EVIDENCE_EXECUTION_PLAN_ARTIFACT_ID,
  SCIENTIFIC_EVIDENCE_EXECUTION_PLAN_SCHEMA_VERSION,
  buildScientificEvidenceExecutionPlanV1,
  validateScientificEvidenceExecutionPlanIntegrityV1,
  type ScientificEvidenceExecutionPlanV1,
} from "@shared/contracts/scientific-evidence-execution-plan.v1";
import { buildAdvectionDiffusionScientificEvidenceEnrollmentV1 } from "@shared/scientific-evidence/advection-diffusion-scientific-evidence-enrollment";
import {
  ADVECTION_DIFFUSION_OBSERVED_THEOREM_TYPE_SHA256,
  buildAdvectionDiffusionZeroGradientLeanBindingV1,
} from "@shared/scientific-evidence/advection-diffusion-zero-gradient-lean-binding";

import {
  evaluateScientificEvidenceClosureV1,
  type EvaluateScientificEvidenceClosureV1Input,
} from "../../theory/scientific-evidence-closure-evaluator";
import type { HelixWorkstationCapabilityManifest } from "./types";

export const SCIENTIFIC_EVIDENCE_CLOSURE_INSPECT_ENROLLMENT_CAPABILITY =
  "scientific-evidence-closure.inspect_enrollment" as const;
export const SCIENTIFIC_EVIDENCE_CLOSURE_PREPARE_CAPABILITY =
  "scientific-evidence-closure.prepare" as const;
export const SCIENTIFIC_EVIDENCE_CLOSURE_EVALUATE_CAPABILITY =
  "scientific-evidence-closure.evaluate" as const;
export const SCIENTIFIC_EVIDENCE_CLOSURE_CAPABILITIES = [
  SCIENTIFIC_EVIDENCE_CLOSURE_INSPECT_ENROLLMENT_CAPABILITY,
  SCIENTIFIC_EVIDENCE_CLOSURE_PREPARE_CAPABILITY,
  SCIENTIFIC_EVIDENCE_CLOSURE_EVALUATE_CAPABILITY,
] as const;

export const SCIENTIFIC_EVIDENCE_ENROLLMENT_OBSERVATION_SCHEMA =
  "casimir.scientific_evidence_enrollment.observation.v1" as const;
export const SCIENTIFIC_EVIDENCE_EXECUTION_PLAN_OBSERVATION_SCHEMA =
  "casimir.scientific_evidence_execution_plan.observation.v1" as const;
export const SCIENTIFIC_EVIDENCE_CLOSURE_OBSERVATION_SCHEMA =
  "casimir.scientific_evidence_closure.observation.v1" as const;
export const SCIENTIFIC_EVIDENCE_CLOSURE_INPUT_KIND =
  "scientific_evidence_closure_input" as const;
export const SCIENTIFIC_EVIDENCE_CLOSURE_INPUT_SCHEMA =
  "scientific_evidence_closure_input/v1" as const;
export const SCIENTIFIC_EVIDENCE_CLOSURE_INPUT_HASH_DOMAIN =
  "scientific-evidence-closure-input/v1" as const;
export const SCIENTIFIC_EVIDENCE_CLOSURE_INPUT_SOURCE_CAPABILITY =
  "codex-runtime.scientific-evidence-closure-input" as const;

export const scientificEvidenceClosureInspectManifest: HelixWorkstationCapabilityManifest =
  {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id:
      SCIENTIFIC_EVIDENCE_CLOSURE_INSPECT_ENROLLMENT_CAPABILITY,
    label: "Inspect scientific evidence enrollment",
    description:
      "Reads the server-enrolled source claim, Theory Badge orientation, semantic identities, formal binding, parameter policy, numerical lineages, and claim ceiling for a conformed scientific runtime slice. It executes nothing and is not an answer.",
    panel_id: "workflow-demo-lab",
    action_id: "inspect_scientific_evidence_enrollment",
    mode: "read",
    mutating: false,
    code_mutation: false,
    shell_access: false,
    requires_confirmation: false,
    requires_source: true,
    terminal_eligible: false,
    permission_profile_required: "read",
    post_tool_model_step_required: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["manifest_id"],
      properties: {
        manifest_id: { type: "string" },
        source_target_intent: { type: "object" },
      },
    },
    output_observation_schema:
      SCIENTIFIC_EVIDENCE_ENROLLMENT_OBSERVATION_SCHEMA,
    observation_schema:
      SCIENTIFIC_EVIDENCE_ENROLLMENT_OBSERVATION_SCHEMA,
    safety_tags: [
      "developer_only",
      "read_only_enrollment",
      "retained_scientific_evidence_sidecar",
      "server_registered_identity",
      "evidence_only",
      "non_terminal",
      "no_shell",
      "no_code_mutation",
      "does_not_validate_scientific_truth",
    ],
    assistant_answer: false,
    raw_content_included: false,
  };

export const scientificEvidenceClosurePrepareManifest: HelixWorkstationCapabilityManifest =
  {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: SCIENTIFIC_EVIDENCE_CLOSURE_PREPARE_CAPABILITY,
    label: "Prepare scientific evidence execution",
    description:
      "Binds an exact enrolled Theory Badge orientation, registered source claim, and permitted parameter intervention into an immutable current-turn execution plan. It stages the Lanyon, Lean, independent numerical, and closure itinerary but executes no tool and grants no confirmation.",
    panel_id: "workflow-demo-lab",
    action_id: "prepare_scientific_evidence_execution",
    mode: "read",
    mutating: false,
    code_mutation: false,
    shell_access: false,
    requires_confirmation: false,
    requires_source: true,
    terminal_eligible: false,
    permission_profile_required: "read",
    post_tool_model_step_required: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: [
        "manifest_id",
        "orientation_id",
        "source_claim_id",
        "intervention_parameter_id",
        "intervention_value",
      ],
      properties: {
        manifest_id: { type: "string" },
        orientation_id: { type: "string" },
        source_claim_id: { type: "string" },
        intervention_parameter_id: { type: "string" },
        intervention_value: { type: "string" },
        source_target_intent: { type: "object" },
      },
    },
    output_observation_schema:
      SCIENTIFIC_EVIDENCE_EXECUTION_PLAN_OBSERVATION_SCHEMA,
    observation_schema:
      SCIENTIFIC_EVIDENCE_EXECUTION_PLAN_OBSERVATION_SCHEMA,
    safety_tags: [
      "developer_only",
      "read_only_execution_planning",
      "exact_user_selection_binding",
      "current_turn_evidence_binding",
      "immutable_plan",
      "lanyon_staging",
      "evidence_only",
      "non_terminal",
      "no_execution",
      "no_confirmation_grant",
      "no_shell",
      "no_code_mutation",
      "no_private_runtime",
      "does_not_validate_scientific_truth",
    ],
    assistant_answer: false,
    raw_content_included: false,
  };

export const scientificEvidenceClosureEvaluateManifest: HelixWorkstationCapabilityManifest =
  {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: SCIENTIFIC_EVIDENCE_CLOSURE_EVALUATE_CAPABILITY,
    label: "Evaluate scientific evidence closure",
    description:
      "Validates a current-turn Codex-runtime observation bundle against the exact server enrollment and emits an immutable, non-terminal closure packet. It evaluates evidence only; Codex retains execution, retry, approval, and answer ownership.",
    panel_id: "workflow-demo-lab",
    action_id: "evaluate_scientific_evidence_closure",
    mode: "read",
    mutating: false,
    code_mutation: false,
    shell_access: false,
    requires_confirmation: false,
    requires_source: true,
    terminal_eligible: false,
    permission_profile_required: "read",
    post_tool_model_step_required: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: [
        "manifest_id",
        "closure_input_artifact_ref",
        "execution_plan_artifact_ref",
        "plan_id",
      ],
      properties: {
        manifest_id: { type: "string" },
        closure_input_artifact_ref: { type: "string" },
        execution_plan_artifact_ref: { type: "string" },
        plan_id: { type: "string" },
        source_target_intent: { type: "object" },
      },
    },
    output_observation_schema:
      SCIENTIFIC_EVIDENCE_CLOSURE_OBSERVATION_SCHEMA,
    observation_schema: SCIENTIFIC_EVIDENCE_CLOSURE_OBSERVATION_SCHEMA,
    safety_tags: [
      "developer_only",
      "read_only_closure_evaluation",
      "current_turn_evidence_binding",
      "exact_manifest_hash_binding",
      "immutable_receipt",
      "evidence_only",
      "non_terminal",
      "no_shell",
      "no_code_mutation",
      "no_private_runtime",
      "does_not_validate_scientific_truth",
    ],
    assistant_answer: false,
    raw_content_included: false,
  };

export const scientificEvidenceClosureManifests = [
  scientificEvidenceClosureInspectManifest,
  scientificEvidenceClosurePrepareManifest,
  scientificEvidenceClosureEvaluateManifest,
] as const;

type RecordLike = Record<string, unknown>;
const record = (value: unknown): RecordLike | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : null;
const string = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

export async function computeScientificEvidenceClosureInputSha256V1(
  value: unknown,
): Promise<string> {
  return computeCasimirSpecValueSha256V1({
    domain: SCIENTIFIC_EVIDENCE_CLOSURE_INPUT_HASH_DOMAIN,
    value,
  });
}

type GatewayOutcome = {
  ok: boolean;
  status: "succeeded" | "blocked" | "failed" | "missing_input";
  admissionStatus: "admitted" | "blocked";
  admissionReason: string;
  blockedReason?: string;
  summary: string;
  observation: RecordLike;
  missingRequirements: Array<{
    code: string;
    message: string;
    repair_action: "repair" | "ask_user" | "use_another_tool";
  }>;
  error?: string;
};

const blocked = (
  code: string,
  summary: string,
  observationSchema = SCIENTIFIC_EVIDENCE_CLOSURE_OBSERVATION_SCHEMA,
): GatewayOutcome => ({
  ok: false,
  status: "blocked",
  admissionStatus: "blocked",
  admissionReason: "scientific_evidence_closure_admission_blocked",
  blockedReason: code,
  summary,
  observation: {
    schema: observationSchema,
    status: "blocked",
    issues: [code],
    output_role: "candidate_next_step",
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
  },
  missingRequirements: [
    {
      code,
      message: summary,
      repair_action: "repair",
    },
  ],
  error: code,
});

export async function executeScientificEvidenceClosureGatewayCapability(input: {
  capabilityId: string;
  args: RecordLike;
  turnId: string;
  authoritativeEvidenceArtifacts?: unknown[];
}): Promise<GatewayOutcome> {
  const enrollment =
    await buildAdvectionDiffusionScientificEvidenceEnrollmentV1();
  const binding =
    await buildAdvectionDiffusionZeroGradientLeanBindingV1();
  const manifestId = string(input.args.manifest_id);
  if (!manifestId) {
    return blocked(
      "scientific_evidence_manifest_id_required",
      "An exact server-enrolled scientific evidence manifest ID is required.",
    );
  }
  if (manifestId !== enrollment.manifest.manifestId) {
    return blocked(
      "scientific_evidence_manifest_not_registered",
      "The requested scientific evidence manifest is not registered.",
    );
  }

  if (
    input.capabilityId ===
    SCIENTIFIC_EVIDENCE_CLOSURE_PREPARE_CAPABILITY
  ) {
    const orientationId = string(input.args.orientation_id);
    const sourceClaimId = string(input.args.source_claim_id);
    const interventionParameterId = string(
      input.args.intervention_parameter_id,
    );
    const interventionValue = string(input.args.intervention_value);
    const missing = [
      ...(!orientationId ? ["scientific_evidence_orientation_id_required"] : []),
      ...(!sourceClaimId ? ["scientific_evidence_source_claim_id_required"] : []),
      ...(!interventionParameterId
        ? ["scientific_evidence_intervention_parameter_id_required"]
        : []),
      ...(!interventionValue
        ? ["scientific_evidence_intervention_value_required"]
        : []),
    ];
    if (missing.length > 0) {
      return blocked(
        missing[0],
        "An exact orientation, source claim, intervention parameter, and intervention value are required.",
        SCIENTIFIC_EVIDENCE_EXECUTION_PLAN_OBSERVATION_SCHEMA,
      );
    }
    if (orientationId !== enrollment.manifest.orientation.orientationId) {
      return blocked(
        "scientific_evidence_orientation_not_enrolled",
        "The selected Theory Badge orientation is not registered in the requested enrollment.",
        SCIENTIFIC_EVIDENCE_EXECUTION_PLAN_OBSERVATION_SCHEMA,
      );
    }
    if (sourceClaimId !== enrollment.manifest.sourceClaim.sourceClaimId) {
      return blocked(
        "scientific_evidence_source_claim_not_enrolled",
        "The selected source claim is not registered in the requested enrollment.",
        SCIENTIFIC_EVIDENCE_EXECUTION_PLAN_OBSERVATION_SCHEMA,
      );
    }
    const parameterPolicy = enrollment.manifest.parameterPolicy;
    if (interventionParameterId !== parameterPolicy.mutableParameterId) {
      const frozen = parameterPolicy.frozenParameters.some(
        (entry) => entry.parameterId === interventionParameterId,
      );
      return blocked(
        frozen
          ? "scientific_evidence_frozen_parameter_mutation_forbidden"
          : "scientific_evidence_intervention_parameter_not_enrolled",
        frozen
          ? "The selected parameter is frozen by the enrollment and cannot be modified."
          : "The selected intervention parameter is not registered as mutable.",
        SCIENTIFIC_EVIDENCE_EXECUTION_PLAN_OBSERVATION_SCHEMA,
      );
    }
    if (!parameterPolicy.permittedValues.includes(interventionValue)) {
      return blocked(
        "scientific_evidence_intervention_value_not_permitted",
        "The requested intervention value is outside the exact enrolled value set.",
        SCIENTIFIC_EVIDENCE_EXECUTION_PLAN_OBSERVATION_SCHEMA,
      );
    }
    if (interventionValue === parameterPolicy.baselineValue) {
      return blocked(
        "scientific_evidence_intervention_must_differ_from_baseline",
        "The intervention must select a permitted value different from the enrolled baseline.",
        SCIENTIFIC_EVIDENCE_EXECUTION_PLAN_OBSERVATION_SCHEMA,
      );
    }
    const frozenParametersSha256 =
      await computeCasimirSpecValueSha256V1({
        domain: "scientific-evidence-frozen-inputs/v1",
        value: parameterPolicy.frozenParameters,
      });
    const plan = await buildScientificEvidenceExecutionPlanV1({
      turnBinding: { turnId: input.turnId },
      enrollment: {
        manifestId: enrollment.manifest.manifestId,
        manifestArtifactSha256:
          enrollment.manifest.artifactSha256,
      },
      selection: {
        orientationId: enrollment.manifest.orientation.orientationId,
        graphId: enrollment.manifest.orientation.graphId,
        selectedBadgeIds: [
          ...enrollment.manifest.orientation.selectedBadgeIds,
        ],
        sourceClaimId: enrollment.manifest.sourceClaim.sourceClaimId,
        sourceClaimArtifactSha256:
          enrollment.sourceClaim.artifactSha256,
      },
      intervention: {
        parameterId: parameterPolicy.mutableParameterId,
        sourceSymbol: parameterPolicy.sourceSymbol,
        unit: parameterPolicy.unit,
        baselineValue: parameterPolicy.baselineValue,
        selectedValue: interventionValue,
        frozenParametersSha256,
      },
      lanyonStaging: {
        producerId: enrollment.manifest.sourceClaim.producerId,
        repositoryUri: enrollment.manifest.sourceClaim.repositoryUri,
        commitSha: enrollment.manifest.sourceClaim.commitSha,
        caseId: enrollment.manifest.sourceClaim.caseId,
        sourceLogicalPath:
          enrollment.manifest.sourceClaim.sourceArtifact.logicalPath,
        sourceSha256:
          enrollment.manifest.sourceClaim.sourceArtifact.sha256,
        requiredCapabilityIds: [
          "theory-experiment-procedure.prepare",
          "theory-semantic-admitter.normalize",
          "theory-artifact-producer.prepare_lanyon_request",
          "theory-artifact-producer.admit_lanyon_snapshot",
        ],
      },
      formalReplay: {
        specId:
          enrollment.manifest.semanticBindings.formalCasimirSpec.specId,
        claimId:
          enrollment.manifest.semanticBindings.formalCasimirSpec.claimId,
        propositionSha256:
          enrollment.manifest.semanticBindings.formalCasimirSpec
            .propositionSha256,
        theoremName: enrollment.manifest.formalContract.theoremName,
        theoremTypeSha256:
          ADVECTION_DIFFUSION_OBSERVED_THEOREM_TYPE_SHA256,
        requiredCapabilityIds: [
          "theory-formal-verifier.prepare_request",
          "theory-formal-verifier.plan",
          "theory-formal-verifier.start",
          "theory-formal-verifier.read_result",
        ],
      },
      numericalReplay: {
        specId:
          enrollment.manifest.semanticBindings.numericalCasimirSpec
            .specId,
        claimId:
          enrollment.manifest.semanticBindings.numericalCasimirSpec
            .claimId,
        propositionSha256:
          enrollment.manifest.semanticBindings.numericalCasimirSpec
            .propositionSha256,
        baselineCaseId:
          enrollment.manifest.numericalContract.baselineCaseId,
        interventionCaseId:
          enrollment.manifest.numericalContract.interventionCaseId,
        primaryLineageId:
          enrollment.manifest.numericalContract.primaryLineageId,
        independentLineageId:
          enrollment.manifest.numericalContract.independentLineageId,
        observableIds: [
          ...enrollment.manifest.numericalContract.observableIds,
        ],
        requiredCapabilityIds: [
          "theory-independent-numerical-verifier.prepare_request",
          "theory-independent-numerical-verifier.plan",
          "theory-independent-numerical-verifier.start",
          "theory-independent-numerical-verifier.read_result",
        ],
      },
      closure: {
        requiredAxes: [
          ...enrollment.manifest.closurePolicy.requiredAxes,
        ],
        evaluationCapabilityId:
          SCIENTIFIC_EVIDENCE_CLOSURE_EVALUATE_CAPABILITY,
        currentTurnEvidenceReentryRequired: true,
      },
    });
    const planIssues =
      await validateScientificEvidenceExecutionPlanIntegrityV1(plan);
    if (planIssues.length > 0) {
      return blocked(
        "scientific_evidence_execution_plan_integrity_failed",
        "The prepared scientific evidence execution plan failed its immutable integrity contract.",
        SCIENTIFIC_EVIDENCE_EXECUTION_PLAN_OBSERVATION_SCHEMA,
      );
    }
    return {
      ok: true,
      status: "succeeded",
      admissionStatus: "admitted",
      admissionReason: "scientific_evidence_execution_plan_prepared",
      summary:
        "Prepared an immutable current-turn scientific evidence execution plan for the exact enrolled orientation, source claim, and parameter intervention; no runtime was executed.",
      observation: {
        schema: SCIENTIFIC_EVIDENCE_EXECUTION_PLAN_OBSERVATION_SCHEMA,
        status: "succeeded",
        current_turn_id: input.turnId,
        current_turn_evidence: true,
        execution_plan: plan,
        operator_next_affordances: [
          {
            schema: "helix.agent_continuation_affordance.v1",
            affordance_id: `${plan.planId}:stage-lanyon`,
            capability: "theory-experiment-procedure.prepare",
            reason:
              "Materialize the current-turn procedure and semantic admission before preparing the exact Lanyon request.",
            requires_confirmation: false,
            executes_automatically: false,
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
          {
            schema: "helix.agent_continuation_affordance.v1",
            affordance_id: `${plan.planId}:execute-formal-and-numerical`,
            capability:
              "theory-formal-verifier.prepare_request + theory-independent-numerical-verifier.prepare_request",
            reason:
              "After Lanyon admission, Codex may prepare confirmation-gated formal and independent numerical replay plans bound to this plan.",
            requires_confirmation: true,
            executes_automatically: false,
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
        ],
        downstream_closure_requirements: [
          "current_turn_procedure_and_semantic_admission_required",
          "current_turn_lanyon_admission_receipt_required",
          "trusted_confirmation_receipt_required",
          "external_formal_sandbox_certificate_required",
          "external_numerical_sandbox_certificates_required",
          "current_turn_runtime_observation_bundle_required",
        ],
        output_role: "candidate_next_step",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      missingRequirements: [],
    };
  }

  if (
    input.capabilityId ===
    SCIENTIFIC_EVIDENCE_CLOSURE_INSPECT_ENROLLMENT_CAPABILITY
  ) {
    const semanticBundleWithoutHash = {
      artifactId: "scientific_semantic_binding_bundle",
      schemaVersion: "scientific_semantic_binding_bundle/v1",
      formalSpecArtifactSha256:
        enrollment.manifest.semanticBindings.formalCasimirSpec.artifactSha256,
      numericalSpecArtifactSha256:
        enrollment.manifest.semanticBindings.numericalCasimirSpec.artifactSha256,
      semanticToLeanBindingArtifactSha256:
        binding.binding.artifactSha256,
      reviewed: true,
    };
    const semanticBundleArtifactSha256 =
      await computeCasimirSpecValueSha256V1({
        domain: "scientific-semantic-binding-bundle/v1",
        value: semanticBundleWithoutHash,
      });
    return {
      ok: true,
      status: "succeeded",
      admissionStatus: "admitted",
      admissionReason: "scientific_evidence_enrollment_inspected",
      summary:
        "Loaded the exact conformed scientific evidence enrollment and retained sidecar; no scientific runtime was executed.",
      observation: {
        schema: SCIENTIFIC_EVIDENCE_ENROLLMENT_OBSERVATION_SCHEMA,
        status: "succeeded",
        current_turn_id: input.turnId,
        current_turn_evidence: true,
        enrollment: {
          manifest: enrollment.manifest,
          source_claim: enrollment.sourceClaim,
          graph_snapshot: enrollment.graphSnapshot,
          semantic_binding: {
            ...semanticBundleWithoutHash,
            artifactSha256: semanticBundleArtifactSha256,
          },
          observed_theorem_type_sha256:
            ADVECTION_DIFFUSION_OBSERVED_THEOREM_TYPE_SHA256,
        },
        operator_next_affordances: [
          {
            schema: "helix.agent_continuation_affordance.v1",
            affordance_id: `${enrollment.manifest.manifestId}:execute-with-codex-runtime`,
            capability:
              SCIENTIFIC_EVIDENCE_CLOSURE_EVALUATE_CAPABILITY,
            reason:
              "Codex must execute the enrolled formal and numerical plans, re-enter their exact observations, then request closure evaluation.",
            requires_confirmation: true,
            executes_automatically: false,
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
        ],
        downstream_closure_requirements: [
          "external_formal_sandbox_certificate_required",
          "external_numerical_sandbox_certificates_required",
          "current_turn_runtime_observation_bundle_required",
        ],
        output_role: "evidence_for_bounded_synthesis",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      missingRequirements: [],
    };
  }

  if (
    input.capabilityId !== SCIENTIFIC_EVIDENCE_CLOSURE_EVALUATE_CAPABILITY
  ) {
    return blocked(
      "scientific_evidence_closure_capability_not_supported",
      "The scientific evidence closure capability is not supported.",
    );
  }
  const artifactRef = string(input.args.closure_input_artifact_ref);
  const executionPlanArtifactRef = string(
    input.args.execution_plan_artifact_ref,
  );
  const planId = string(input.args.plan_id);
  if (!artifactRef || !executionPlanArtifactRef || !planId) {
    return blocked(
      "scientific_evidence_closure_input_required",
      "The exact current-turn closure input ref, execution-plan ref, and plan ID are required.",
    );
  }
  const planMatches = (input.authoritativeEvidenceArtifacts ?? [])
    .map(record)
    .filter((artifact): artifact is RecordLike => Boolean(artifact))
    .filter(
      (artifact) =>
        string(artifact.artifact_id) === executionPlanArtifactRef,
    );
  if (planMatches.length !== 1) {
    return blocked(
      planMatches.length === 0
        ? "scientific_evidence_execution_plan_not_found"
        : "scientific_evidence_execution_plan_ambiguous",
      "The execution plan must resolve to exactly one authoritative current-turn artifact.",
    );
  }
  const planArtifact = planMatches[0];
  const planPayload = record(planArtifact.payload);
  const executionPlan = record(planPayload?.execution_plan);
  if (
    planArtifact.schema !== "helix.current_turn_artifact.v1" ||
    planArtifact.turn_id !== input.turnId ||
    planArtifact.source_scope !== "current_turn_context" ||
    planArtifact.kind !==
      "scientific_evidence_execution_plan_observation" ||
    planArtifact.payload_schema !==
      SCIENTIFIC_EVIDENCE_EXECUTION_PLAN_OBSERVATION_SCHEMA ||
    planArtifact.source_capability_id !==
      SCIENTIFIC_EVIDENCE_CLOSURE_PREPARE_CAPABILITY ||
    planArtifact.capability_key !==
      SCIENTIFIC_EVIDENCE_CLOSURE_PREPARE_CAPABILITY ||
    !planPayload ||
    !executionPlan ||
    executionPlan.artifactId !==
      SCIENTIFIC_EVIDENCE_EXECUTION_PLAN_ARTIFACT_ID ||
    executionPlan.schemaVersion !==
      SCIENTIFIC_EVIDENCE_EXECUTION_PLAN_SCHEMA_VERSION ||
    executionPlan.planId !== planId ||
    executionPlan.turnBinding === undefined ||
    record(executionPlan.turnBinding)?.turnId !== input.turnId
  ) {
    return blocked(
      "scientific_evidence_execution_plan_identity_invalid",
      "The execution plan is stale, aliased, malformed, or not admitted as current-turn evidence.",
    );
  }
  const executionPlanIssues =
    await validateScientificEvidenceExecutionPlanIntegrityV1(
      executionPlan,
    );
  if (
    executionPlanIssues.length > 0 ||
    string(planArtifact.content_sha256) !==
      string(executionPlan.artifactSha256)
  ) {
    return blocked(
      "scientific_evidence_execution_plan_integrity_invalid",
      "The execution plan failed its immutable content and envelope integrity checks.",
    );
  }
  const matches = (input.authoritativeEvidenceArtifacts ?? [])
    .map(record)
    .filter((artifact): artifact is RecordLike => Boolean(artifact))
    .filter((artifact) => string(artifact.artifact_id) === artifactRef);
  if (matches.length !== 1) {
    return blocked(
      matches.length === 0
        ? "scientific_evidence_closure_input_not_found"
        : "scientific_evidence_closure_input_ambiguous",
      "The closure input must resolve to exactly one authoritative current-turn artifact.",
    );
  }
  const artifact = matches[0];
  const payload = record(artifact.payload);
  const closureInput = record(payload?.closure_input);
  if (
    artifact.schema !== "helix.current_turn_artifact.v1" ||
    artifact.turn_id !== input.turnId ||
    artifact.source_scope !== "current_turn_context" ||
    artifact.kind !== SCIENTIFIC_EVIDENCE_CLOSURE_INPUT_KIND ||
    artifact.payload_schema !== SCIENTIFIC_EVIDENCE_CLOSURE_INPUT_SCHEMA ||
    artifact.source_capability_id !==
      SCIENTIFIC_EVIDENCE_CLOSURE_INPUT_SOURCE_CAPABILITY ||
    artifact.capability_key !==
      SCIENTIFIC_EVIDENCE_CLOSURE_INPUT_SOURCE_CAPABILITY ||
    !payload ||
    payload.schema !== SCIENTIFIC_EVIDENCE_CLOSURE_INPUT_SCHEMA ||
    payload.current_turn_id !== input.turnId ||
    !closureInput
  ) {
    return blocked(
      "scientific_evidence_closure_input_identity_invalid",
      "The closure input is stale, aliased, malformed, or not admitted as current-turn evidence.",
    );
  }
  const declaredContentSha256 = string(artifact.content_sha256);
  const expectedContentSha256 =
    await computeScientificEvidenceClosureInputSha256V1(payload);
  if (declaredContentSha256 !== expectedContentSha256) {
    return blocked(
      "scientific_evidence_closure_input_hash_mismatch",
      "The closure input content digest does not match its payload.",
    );
  }
  if (
    string(closureInput.turnId) !== input.turnId ||
    string(closureInput.planId) !== planId
  ) {
    return blocked(
      "scientific_evidence_closure_turn_or_plan_mismatch",
      "The closure input is not bound to the exact current turn and plan.",
    );
  }

  let packet;
  try {
    packet = await evaluateScientificEvidenceClosureV1({
      ...(closureInput as unknown as Omit<
        EvaluateScientificEvidenceClosureV1Input,
        "enrollment" | "executionPlan"
      >),
      executionPlan:
        executionPlan as unknown as ScientificEvidenceExecutionPlanV1,
      enrollment: {
        manifest: enrollment.manifest,
        sourceClaimArtifactSha256:
          enrollment.sourceClaim.artifactSha256,
        graphSnapshotArtifactSha256:
          enrollment.graphSnapshot.artifactSha256,
        semanticToLeanBindingArtifactSha256:
          binding.binding.artifactSha256,
        observedTheoremTypeSha256:
          ADVECTION_DIFFUSION_OBSERVED_THEOREM_TYPE_SHA256,
      },
    });
  } catch {
    return blocked(
      "scientific_evidence_closure_input_contract_invalid",
      "The current-turn closure input did not satisfy the evaluator contract.",
    );
  }
  const packetIssues =
    await validateScientificEvidenceClosurePacketIntegrityV1(packet);
  if (packetIssues.length > 0) {
    return blocked(
      "scientific_evidence_closure_packet_integrity_failed",
      "The emitted closure packet failed its immutable integrity contract.",
    );
  }
  return {
    ok: true,
    status: "succeeded",
    admissionStatus: "admitted",
    admissionReason: "scientific_evidence_closure_evaluated",
    summary:
      packet.status === "satisfied"
        ? "Scientific evidence closure is satisfied within the exact bounded enrollment; model synthesis is still required."
        : `Scientific evidence closure is ${packet.status} with ${packet.blockers.length} typed blocker(s).`,
    observation: {
      schema: SCIENTIFIC_EVIDENCE_CLOSURE_OBSERVATION_SCHEMA,
      status: "succeeded",
      current_turn_id: input.turnId,
      current_turn_evidence: true,
      closure_packet: packet,
      output_role: "evidence_for_bounded_synthesis",
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    },
    missingRequirements: packet.blockers.map((blocker) => ({
      code: blocker.code,
      message: blocker.message,
      repair_action: "repair",
    })),
  };
}
