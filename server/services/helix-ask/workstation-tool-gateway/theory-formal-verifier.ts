import type { HelixAccountType } from "@shared/helix-account-session";

import {
  planCasimirFormalVerifierJobV1,
  readCasimirFormalVerifierJobResultV1,
  startCasimirFormalVerifierJobV1,
} from "../../theory/casimir-formal-verifier-job-service";
import {
  prepareCasimirFormalVerificationRequestV1,
  resolveCasimirFormalPreparedRequestV1,
} from "../../theory/casimir-formal-verification-preparer";
import type { HelixWorkstationCapabilityManifest } from "./types";

export const THEORY_FORMAL_VERIFIER_PREPARE_REQUEST_CAPABILITY =
  "theory-formal-verifier.prepare_request" as const;
export const THEORY_FORMAL_VERIFIER_PLAN_CAPABILITY =
  "theory-formal-verifier.plan" as const;
export const THEORY_FORMAL_VERIFIER_START_CAPABILITY =
  "theory-formal-verifier.start" as const;
export const THEORY_FORMAL_VERIFIER_READ_RESULT_CAPABILITY =
  "theory-formal-verifier.read_result" as const;

export const THEORY_FORMAL_VERIFIER_CAPABILITIES = [
  THEORY_FORMAL_VERIFIER_PREPARE_REQUEST_CAPABILITY,
  THEORY_FORMAL_VERIFIER_PLAN_CAPABILITY,
  THEORY_FORMAL_VERIFIER_START_CAPABILITY,
  THEORY_FORMAL_VERIFIER_READ_RESULT_CAPABILITY,
] as const;

const FORMAL_VERIFIER_PREPARATION_OBSERVATION_SCHEMA =
  "casimir.theory_formal_verifier.preparation_observation.v1" as const;
const FORMAL_VERIFIER_PLAN_OBSERVATION_SCHEMA =
  "casimir.theory_formal_verifier.plan_observation.v1" as const;
const FORMAL_VERIFIER_START_OBSERVATION_SCHEMA =
  "casimir.theory_formal_verifier.start_observation.v1" as const;
const FORMAL_VERIFIER_RESULT_OBSERVATION_SCHEMA =
  "casimir.theory_formal_verifier.result_observation.v1" as const;

const preparedRequestProperties = {
  prepared_request_id: { type: "string" },
} as const;

export const theoryFormalVerifierPrepareRequestManifest: HelixWorkstationCapabilityManifest =
  {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: THEORY_FORMAL_VERIFIER_PREPARE_REQUEST_CAPABILITY,
    label: "Prepare formal verification request",
    description:
      "Inspects authoritative current-turn procedure, semantic-admission, and formal-artifact evidence against server-owned theorem and Lean-environment catalogs. It returns a hash-bound ready-or-blocked evidence receipt and never runs Lean.",
    panel_id: "theory-badge-graph",
    action_id: "prepare_formal_verification_request",
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
        "procedure_artifact_ref",
        "procedure_id",
        "procedure_sha256",
      ],
      properties: {
        procedure_artifact_ref: { type: "string" },
        procedure_id: { type: "string" },
        procedure_sha256: { type: "string" },
        semantic_admission_artifact_ref: { type: "string" },
        artifact_generation_artifact_ref: { type: "string" },
        claim_id: { type: "string" },
        formal_artifact_id: { type: "string" },
        theorem_name: { type: "string" },
        environment_policy_id: { type: "string" },
        source_target_intent: { type: "object" },
      },
    },
    output_observation_schema:
      FORMAL_VERIFIER_PREPARATION_OBSERVATION_SCHEMA,
    observation_schema:
      FORMAL_VERIFIER_PREPARATION_OBSERVATION_SCHEMA,
    safety_tags: [
      "developer_only",
      "read_only_preparation",
      "server_owned_trust_catalogs",
      "typed_missing_requirements",
      "formal_evidence",
      "non_terminal",
      "no_shell",
      "no_code_mutation",
      "does_not_validate_semantic_equivalence",
      "does_not_validate_scientific_truth",
    ],
    assistant_answer: false,
    raw_content_included: false,
  };

export const theoryFormalVerifierPlanManifest: HelixWorkstationCapabilityManifest =
  {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: THEORY_FORMAL_VERIFIER_PLAN_CAPABILITY,
    label: "Plan formal theorem replay",
    description:
      "Preflights only a ready server-owned prepared-request record. Raw caller-supplied requests, policies, and source paths are not plan authority.",
    panel_id: "theory-badge-graph",
    action_id: "plan_formal_verification",
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
      required: ["prepared_request_id"],
      properties: {
        ...preparedRequestProperties,
        source_target_intent: { type: "object" },
      },
    },
    output_observation_schema: FORMAL_VERIFIER_PLAN_OBSERVATION_SCHEMA,
    observation_schema: FORMAL_VERIFIER_PLAN_OBSERVATION_SCHEMA,
    safety_tags: [
      "developer_only",
      "read_only_preflight",
      "formal_evidence",
      "non_terminal",
      "no_shell",
      "no_code_mutation",
      "does_not_validate_scientific_truth",
    ],
    assistant_answer: false,
    raw_content_included: false,
  };

export const theoryFormalVerifierStartManifest: HelixWorkstationCapabilityManifest =
  {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: THEORY_FORMAL_VERIFIER_START_CAPABILITY,
    label: "Start pinned Lean replay",
    description:
      "Starts one confirmation-gated, policy-bounded Lean replay job for an exact preflight plan. The resulting certificate is evidence only and must be read and re-entered before synthesis.",
    panel_id: "theory-badge-graph",
    action_id: "start_formal_verification",
    mode: "act",
    mutating: false,
    code_mutation: false,
    shell_access: false,
    requires_confirmation: true,
    requires_source: true,
    terminal_eligible: false,
    permission_profile_required: "act",
    post_tool_model_step_required: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["prepared_request_id", "plan_id"],
      properties: {
        ...preparedRequestProperties,
        plan_id: { type: "string" },
        source_target_intent: { type: "object" },
      },
    },
    output_observation_schema: FORMAL_VERIFIER_START_OBSERVATION_SCHEMA,
    observation_schema: FORMAL_VERIFIER_START_OBSERVATION_SCHEMA,
    safety_tags: [
      "developer_only",
      "requires_confirmation",
      "pinned_lean_replay",
      "formal_evidence",
      "non_terminal",
      "no_shell",
      "no_code_mutation",
      "does_not_validate_scientific_truth",
    ],
    assistant_answer: false,
    raw_content_included: false,
  };

export const theoryFormalVerifierReadResultManifest: HelixWorkstationCapabilityManifest =
  {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: THEORY_FORMAL_VERIFIER_READ_RESULT_CAPABILITY,
    label: "Read formal replay certificate",
    description:
      "Reads the developer-scoped status or evidence-only certificate for a formal replay job. It does not promote the certificate into a scientific conclusion or final answer.",
    panel_id: "theory-badge-graph",
    action_id: "read_formal_verification_result",
    mode: "read",
    mutating: false,
    code_mutation: false,
    shell_access: false,
    requires_confirmation: false,
    requires_source: false,
    terminal_eligible: false,
    permission_profile_required: "read",
    post_tool_model_step_required: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["job_id"],
      properties: {
        job_id: { type: "string" },
        poll_attempt: { type: "integer", minimum: 0 },
        source_target_intent: { type: "object" },
      },
    },
    output_observation_schema: FORMAL_VERIFIER_RESULT_OBSERVATION_SCHEMA,
    observation_schema: FORMAL_VERIFIER_RESULT_OBSERVATION_SCHEMA,
    safety_tags: [
      "developer_only",
      "read_only_evidence",
      "formal_certificate",
      "non_terminal",
      "no_shell",
      "no_code_mutation",
      "requires_evidence_reentry",
    ],
    assistant_answer: false,
    raw_content_included: false,
  };

export const theoryFormalVerifierManifests = [
  theoryFormalVerifierPrepareRequestManifest,
  theoryFormalVerifierPlanManifest,
  theoryFormalVerifierStartManifest,
  theoryFormalVerifierReadResultManifest,
] as const;

const readRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readPollAttempt = (value: unknown): number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 0
    ? value
    : 0;

const formalStartAffordance = (
  preparedRequestId: string,
  planId: string,
): Record<string, unknown> => ({
  schema: "helix.provider_next_affordance.v1",
  affordance_id: `formal-verifier:start:${planId}`,
  capability: THEORY_FORMAL_VERIFIER_START_CAPABILITY,
  mode: "act",
  reason:
    "exact_formal_verifier_plan_ready_for_confirmed_evidence_only_start",
  requires_confirmation: true,
  executes_automatically: false,
  lane_request: {
    capability: THEORY_FORMAL_VERIFIER_START_CAPABILITY,
    prepared_request_id: preparedRequestId,
    plan_id: planId,
  },
  terminal_eligible: false,
  assistant_answer: false,
  raw_content_included: false,
});

const formalReadResultAffordance = (
  jobId: string,
  pollAttempt: number,
): Record<string, unknown> => ({
  schema: "helix.provider_next_affordance.v1",
  affordance_id: `formal-verifier:read-result:${jobId}:${pollAttempt}`,
  capability: THEORY_FORMAL_VERIFIER_READ_RESULT_CAPABILITY,
  mode: "read",
  reason: "read_evidence_only_formal_verifier_job_status",
  requires_confirmation: false,
  executes_automatically: false,
  lane_request: {
    capability: THEORY_FORMAL_VERIFIER_READ_RESULT_CAPABILITY,
    job_id: jobId,
    poll_attempt: pollAttempt,
  },
  terminal_eligible: false,
  assistant_answer: false,
  raw_content_included: false,
});

const formalPlanAffordance = (
  preparedRequestId: string,
): Record<string, unknown> => ({
  schema: "helix.provider_next_affordance.v1",
  affordance_id: `formal-verifier:plan:${preparedRequestId}`,
  capability: THEORY_FORMAL_VERIFIER_PLAN_CAPABILITY,
  mode: "read",
  reason: "server_owned_formal_request_preparation_ready",
  requires_confirmation: false,
  executes_automatically: false,
  lane_request: {
    capability: THEORY_FORMAL_VERIFIER_PLAN_CAPABILITY,
    prepared_request_id: preparedRequestId,
  },
  terminal_eligible: false,
  assistant_answer: false,
  raw_content_included: false,
});

export type TheoryFormalVerifierGatewayExecution = {
  ok: boolean;
  status:
    | "succeeded"
    | "blocked"
    | "missing_input"
    | "needs_confirmation"
    | "failed"
    | "client_pending";
  admissionStatus: "admitted" | "blocked";
  admissionReason: string;
  blockedReason?: string;
  summary: string;
  observation: unknown;
  missingRequirements: Array<{
    code: string;
    message: string;
    repair_action: "ask_user" | "repair";
  }>;
  error?: string;
};

export async function executeTheoryFormalVerifierGatewayCapability(input: {
  capabilityId: string;
  args: Record<string, unknown>;
  accountType: HelixAccountType;
  profileId?: string | null;
  sessionId?: string | null;
  turnId?: string | null;
  authoritativeEvidenceArtifacts?: unknown[];
  approvalReceipt?: unknown;
  approvalToken?: string | null;
}): Promise<TheoryFormalVerifierGatewayExecution> {
  const developer = input.accountType === "developer";
  if (!developer) {
    const observation = {
      schema: "casimir.theory_formal_verifier.account_blocked.v1",
      status: "blocked",
      blocked_reason: "developer_account_required",
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    return {
      ok: false,
      status: "blocked",
      admissionStatus: "blocked",
      admissionReason: "developer_account_required",
      blockedReason: "developer_account_required",
      summary: "Formal verification is restricted to developer accounts.",
      observation,
      missingRequirements: [
        {
          code: "developer_account_required",
          message:
            "Use a trusted developer account for experimental formal replay.",
          repair_action: "ask_user",
        },
      ],
      error: "developer_account_required",
    };
  }

  if (
    input.capabilityId ===
    THEORY_FORMAL_VERIFIER_PREPARE_REQUEST_CAPABILITY
  ) {
    const result = await prepareCasimirFormalVerificationRequestV1({
      profileId: input.profileId,
      turnId: input.turnId ?? "turn:unscoped",
      args: input.args,
      authoritativeEvidenceArtifacts:
        input.authoritativeEvidenceArtifacts,
    });
    const receipt = result.receipt;
    const ready = result.ok && receipt.disposition === "ready";
    const observation = {
      schema: FORMAL_VERIFIER_PREPARATION_OBSERVATION_SCHEMA,
      status: ready ? "succeeded" : "blocked",
      disposition: receipt.disposition,
      prepared_request_id: receipt.preparedRequestId,
      preparation_receipt: receipt,
      missing_requirements: receipt.missingRequirements,
      next_affordances: ready
        ? [formalPlanAffordance(receipt.preparedRequestId)]
        : [],
      output_role: "candidate_next_step",
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    return {
      ok: ready,
      status: ready ? "succeeded" : "blocked",
      admissionStatus: ready ? "admitted" : "blocked",
      admissionReason: ready
        ? "formal_prepared_request_ready"
        : "formal_prepared_request_blocked",
      ...(ready
        ? {}
        : {
            blockedReason:
              receipt.missingRequirements[0]?.code ??
              "formal_prepared_request_not_ready",
          }),
      summary: ready
        ? "Prepared a server-owned formal verification request; developer-only preflight is now available."
        : "Prepared an evidence-only formal readiness receipt, but theorem meaning or environment closure remains incomplete.",
      observation,
      missingRequirements: receipt.missingRequirements.map(
        (requirement) => ({
          code: requirement.code,
          message: requirement.message,
          repair_action:
            requirement.code === "formal_claim_selection_required"
              ? ("ask_user" as const)
              : ("repair" as const),
        }),
      ),
      ...(ready
        ? {}
        : {
            error:
              receipt.missingRequirements[0]?.code ??
              "formal_prepared_request_not_ready",
          }),
    };
  }

  if (input.capabilityId === THEORY_FORMAL_VERIFIER_READ_RESULT_CAPABILITY) {
    const pollAttempt = readPollAttempt(input.args.poll_attempt);
    const result = readCasimirFormalVerifierJobResultV1({
      accountType: input.accountType,
      profileId: input.profileId,
      jobId: readString(input.args.job_id ?? input.args.jobId),
    });
    const running = result.status === "running";
    const completed = result.status === "completed";
    const blocked = result.status === "blocked";
    const failed = result.status === "failed";
    const observation = {
      ...result,
      schema: FORMAL_VERIFIER_RESULT_OBSERVATION_SCHEMA,
      output_role: "evidence_for_synthesis",
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      next_affordances:
        running && result.jobId
          ? [formalReadResultAffordance(result.jobId, pollAttempt + 1)]
          : [],
    };
    return {
      ok: result.ok,
      status: running
        ? "client_pending"
        : completed
          ? "succeeded"
          : blocked
            ? "blocked"
            : "failed",
      admissionStatus: blocked ? "blocked" : "admitted",
      admissionReason: blocked
        ? "formal_verifier_result_read_blocked"
        : "developer_scoped_formal_verifier_result_read",
      ...(blocked || failed
        ? { blockedReason: result.issues[0] ?? "formal_verifier_result_failed" }
        : {}),
      summary: running
        ? "The pinned Lean replay job is still running."
        : completed
          ? `The pinned Lean replay produced a ${result.certificate?.status ?? "completed"} evidence certificate.`
          : "The formal replay result could not be read.",
      observation,
      missingRequirements: result.issues.map((code: string) => ({
        code,
        message: `Formal replay result requires repair: ${code}.`,
        repair_action: blocked ? "ask_user" : "repair",
      })),
      ...(blocked || failed
        ? { error: result.issues[0] ?? "formal_verifier_result_failed" }
        : {}),
    };
  }

  if (
    input.capabilityId === THEORY_FORMAL_VERIFIER_START_CAPABILITY &&
    readString(input.approvalToken)
  ) {
    const issue = "runtime_approval_legacy_token_rejected";
    return {
      ok: false,
      status: "blocked",
      admissionStatus: "blocked",
      admissionReason: "formal_verifier_start_blocked",
      blockedReason: issue,
      summary:
        "The formal replay was not started because legacy confirmation strings are not trusted runtime receipts.",
      observation: {
        schema: FORMAL_VERIFIER_START_OBSERVATION_SCHEMA,
        ok: false,
        status: "blocked",
        issues: [issue],
        next_affordances: [],
        output_role: "candidate_next_step",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      missingRequirements: [
        {
          code: issue,
          message:
            "Obtain an exact, single-use confirmation receipt from the trusted Codex runtime approval lifecycle.",
          repair_action: "repair",
        },
      ],
      error: issue,
    };
  }

  const preparedRequestId = readString(
    input.args.prepared_request_id ??
      input.args.preparedRequestId,
  );
  const prepared = await resolveCasimirFormalPreparedRequestV1({
    profileId: input.profileId,
    preparedRequestId,
  });
  if (!prepared.ok || !prepared.sealedInput) {
    const issue =
      prepared.issues[0] ?? "formal_prepared_request_not_ready";
    const planning =
      input.capabilityId === THEORY_FORMAL_VERIFIER_PLAN_CAPABILITY;
    const observation = {
      schema: planning
        ? FORMAL_VERIFIER_PLAN_OBSERVATION_SCHEMA
        : FORMAL_VERIFIER_START_OBSERVATION_SCHEMA,
      ok: false,
      status: "blocked",
      issues: prepared.issues,
      prepared_request_id: preparedRequestId,
      preparation_receipt: prepared.receipt,
      next_affordances: [],
      output_role: "candidate_next_step",
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    return {
      ok: false,
      status:
        [
          "formal_prepared_request_required",
          "formal_prepared_request_profile_id_required",
        ].includes(issue)
          ? "missing_input"
          : "blocked",
      admissionStatus: "blocked",
      admissionReason: planning
        ? "formal_verifier_prepared_request_gate_blocked"
        : "formal_verifier_start_prepared_request_gate_blocked",
      blockedReason: issue,
      summary: planning
        ? "Formal replay preflight requires a ready server-owned prepared-request record."
        : "Formal replay start requires the same ready server-owned prepared-request record used for preflight.",
      observation,
      missingRequirements: prepared.issues.map((code) => ({
        code,
        message:
          code === "formal_prepared_request_required"
            ? "Call theory-formal-verifier.prepare_request and provide its ready prepared_request_id."
            : code === "formal_environment_policy_catalog_unconfigured"
              ? "Configure a server-owned Lean environment policy and actual import closure."
              : `Formal prepared-request gate requires repair: ${code}.`,
        repair_action: "repair",
      })),
      error: issue,
    };
  }
  const sealedInput = prepared.sealedInput;
  if (input.capabilityId === THEORY_FORMAL_VERIFIER_PLAN_CAPABILITY) {
    const result = await planCasimirFormalVerifierJobV1({
      accountType: input.accountType,
      profileId: input.profileId,
      sealedInput,
    });
    const observation = {
      ...result,
      schema: FORMAL_VERIFIER_PLAN_OBSERVATION_SCHEMA,
      prepared_request_id: preparedRequestId,
      preparation_receipt_sha256:
        prepared.receipt?.receiptSha256 ?? null,
      output_role: "candidate_next_step",
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      next_affordances:
        result.ok && result.planId
          ? [
              formalStartAffordance(
                preparedRequestId as string,
                result.planId,
              ),
            ]
          : [],
    };
    return {
      ok: result.ok,
      status: result.ok ? "succeeded" : "blocked",
      admissionStatus: result.ok ? "admitted" : "blocked",
      admissionReason: result.ok
        ? "formal_verifier_preflight_ready"
        : "formal_verifier_preflight_blocked",
      ...(result.ok ? {} : { blockedReason: result.issues[0] }),
      summary: result.ok
        ? "The exact formal replay inputs passed developer-only preflight; confirmation is required before execution."
        : "The exact formal replay inputs failed preflight.",
      observation,
      missingRequirements: result.issues.map((code: string) => ({
        code,
        message: `Formal replay preflight requires repair: ${code}.`,
        repair_action: "repair",
      })),
      ...(result.ok ? {} : { error: result.issues[0] }),
    };
  }

  const result = await startCasimirFormalVerifierJobV1({
    accountType: input.accountType,
    profileId: input.profileId,
    sealedInput,
    planId: readString(input.args.plan_id ?? input.args.planId),
    sessionId: input.sessionId,
    turnId: input.turnId,
    approvalReceipt: input.approvalReceipt,
    approvalToken: input.approvalToken,
  });
  const needsConfirmation = result.status === "needs_confirmation";
  const blocked = result.status === "blocked";
  const observation = {
    ...result,
    schema: FORMAL_VERIFIER_START_OBSERVATION_SCHEMA,
    prepared_request_id: preparedRequestId,
    preparation_receipt_sha256:
      prepared.receipt?.receiptSha256 ?? null,
    output_role: "candidate_next_step",
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
    next_affordances:
      result.ok && result.status === "running" && result.jobId
        ? [formalReadResultAffordance(result.jobId, 0)]
        : [],
  };
  return {
    ok: result.ok,
    status: needsConfirmation
      ? "needs_confirmation"
      : blocked
        ? "blocked"
        : "client_pending",
    admissionStatus: blocked || needsConfirmation ? "blocked" : "admitted",
    admissionReason: needsConfirmation
      ? "runtime_confirmation_required"
      : blocked
        ? "formal_verifier_start_blocked"
        : "confirmed_formal_verifier_job_started",
    ...(blocked || needsConfirmation
      ? { blockedReason: result.issues[0] }
      : {}),
    summary: needsConfirmation
      ? "The formal replay was not started because runtime confirmation is required."
      : blocked
        ? "The formal replay job was not started."
        : "The confirmed pinned Lean replay job started; read_result is required to obtain evidence.",
    observation,
    missingRequirements: result.issues.map((code: string) => ({
      code,
      message:
        code === "runtime_approval_receipt_required"
          ? "Obtain explicit user confirmation and an exact receipt through the trusted runtime approval lifecycle."
          : code === "runtime_approval_receipt_issuer_unconfigured"
            ? "Configure a trusted Codex runtime confirmation-receipt verifier; Helix does not issue approval receipts."
          : `Formal replay start requires repair: ${code}.`,
      repair_action:
        code === "runtime_approval_receipt_required" ? "ask_user" : "repair",
    })),
    ...(blocked || needsConfirmation ? { error: result.issues[0] } : {}),
  };
}
