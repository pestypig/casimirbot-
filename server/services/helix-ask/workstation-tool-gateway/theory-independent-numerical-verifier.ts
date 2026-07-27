import type { HelixAccountType } from "@shared/helix-account-session";

import {
  planCasimirIndependentNumericalVerifierJobV1,
  prepareCasimirIndependentNumericalVerifierRequestV1,
  readCasimirIndependentNumericalVerifierJobResultV1,
  startCasimirIndependentNumericalVerifierJobV1,
} from "../../theory/casimir-independent-numerical-verifier-job-service";
import type { HelixWorkstationCapabilityManifest } from "./types";

export const THEORY_INDEPENDENT_NUMERICAL_PREPARE_REQUEST_CAPABILITY =
  "theory-independent-numerical-verifier.prepare_request" as const;
export const THEORY_INDEPENDENT_NUMERICAL_PLAN_CAPABILITY =
  "theory-independent-numerical-verifier.plan" as const;
export const THEORY_INDEPENDENT_NUMERICAL_START_CAPABILITY =
  "theory-independent-numerical-verifier.start" as const;
export const THEORY_INDEPENDENT_NUMERICAL_READ_RESULT_CAPABILITY =
  "theory-independent-numerical-verifier.read_result" as const;
export const THEORY_INDEPENDENT_NUMERICAL_CAPABILITIES = [
  THEORY_INDEPENDENT_NUMERICAL_PREPARE_REQUEST_CAPABILITY,
  THEORY_INDEPENDENT_NUMERICAL_PLAN_CAPABILITY,
  THEORY_INDEPENDENT_NUMERICAL_START_CAPABILITY,
  THEORY_INDEPENDENT_NUMERICAL_READ_RESULT_CAPABILITY,
] as const;

const PREPARED_REQUEST_SCHEMA =
  "casimir.theory_independent_numerical_verifier.prepared_request_observation.v1" as const;
const PLAN_SCHEMA =
  "casimir.theory_independent_numerical_verifier.plan_observation.v1" as const;
const START_SCHEMA =
  "casimir.theory_independent_numerical_verifier.start_observation.v1" as const;
const RESULT_SCHEMA =
  "casimir.theory_independent_numerical_verifier.result_observation.v1" as const;

const commonManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  panel_id: "theory-badge-graph",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_source: true,
  terminal_eligible: false,
  post_tool_model_step_required: true,
  assistant_answer: false,
  raw_content_included: false,
} as const;

export const theoryIndependentNumericalPrepareRequestManifest: HelixWorkstationCapabilityManifest =
  {
    ...commonManifest,
    capability_id: THEORY_INDEPENDENT_NUMERICAL_PREPARE_REQUEST_CAPABILITY,
    label: "Prepare trusted numerical replay request",
    description:
      "Requires an integrity-valid procedure observation admitted in the exact current turn, then resolves the same procedure from an opaque server-installed numerical execution catalog and seals its policy, implementation identities, sandbox-capability attestation, and executable paths without exposing those authority-bearing fields to model authorship.",
    action_id: "prepare_independent_numerical_verification_request",
    mode: "read",
    requires_confirmation: false,
    permission_profile_required: "read",
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["catalog_entry_id", "procedure_id", "procedure_sha256"],
      properties: {
        catalog_entry_id: { type: "string", minLength: 1 },
        procedure_id: { type: "string", minLength: 1 },
        procedure_sha256: {
          type: "string",
          pattern: "^[a-f0-9]{64}$",
        },
        source_target_intent: { type: "object" },
      },
    },
    output_observation_schema: PREPARED_REQUEST_SCHEMA,
    observation_schema: PREPARED_REQUEST_SCHEMA,
    safety_tags: [
      "developer_only",
      "read_only_preparation",
      "current_turn_authoritative_procedure_required",
      "server_owned_execution_catalog",
      "independent_numerical_evidence",
      "non_terminal",
      "no_shell",
      "no_code_mutation",
      "does_not_validate_numerical_implementation",
      "does_not_validate_scientific_truth",
    ],
  };

export const theoryIndependentNumericalPlanManifest: HelixWorkstationCapabilityManifest =
  {
    ...commonManifest,
    capability_id: THEORY_INDEPENDENT_NUMERICAL_PLAN_CAPABILITY,
    label: "Plan independent numerical replay",
    description:
      "Preflights a server-prepared, hash-bound numerical request, pinned Casimir harness, two implementation lineages, build manifests, executables, environments, and comparison policy without executing them.",
    action_id: "plan_independent_numerical_verification",
    mode: "read",
    requires_confirmation: false,
    permission_profile_required: "read",
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["prepared_request_id"],
      properties: {
        prepared_request_id: { type: "string", minLength: 1 },
        source_target_intent: { type: "object" },
      },
    },
    output_observation_schema: PLAN_SCHEMA,
    observation_schema: PLAN_SCHEMA,
    safety_tags: [
      "developer_only",
      "read_only_preflight",
      "server_prepared_request_required",
      "independent_numerical_evidence",
      "non_terminal",
      "no_shell",
      "no_code_mutation",
      "does_not_validate_numerical_implementation",
      "does_not_validate_scientific_truth",
    ],
  };

export const theoryIndependentNumericalStartManifest: HelixWorkstationCapabilityManifest =
  {
    ...commonManifest,
    capability_id: THEORY_INDEPENDENT_NUMERICAL_START_CAPABILITY,
    label: "Start independent numerical replay",
    description:
      "Starts one confirmation-gated, policy-bounded Casimir harness job for an exact preflight plan. Its certificate is bounded numerical evidence, not implementation correctness or physical truth.",
    action_id: "start_independent_numerical_verification",
    mode: "act",
    requires_confirmation: true,
    permission_profile_required: "act",
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["plan_id"],
      properties: {
        plan_id: { type: "string", minLength: 1 },
        source_target_intent: { type: "object" },
      },
    },
    output_observation_schema: START_SCHEMA,
    observation_schema: START_SCHEMA,
    safety_tags: [
      "developer_only",
      "requires_confirmation",
      "server_prepared_request_required",
      "pinned_numerical_harness",
      "independent_numerical_evidence",
      "non_terminal",
      "no_shell",
      "no_code_mutation",
      "does_not_validate_numerical_implementation",
      "does_not_validate_scientific_truth",
    ],
  };

export const theoryIndependentNumericalReadResultManifest: HelixWorkstationCapabilityManifest =
  {
    ...commonManifest,
    capability_id: THEORY_INDEPENDENT_NUMERICAL_READ_RESULT_CAPABILITY,
    label: "Read independent numerical certificate",
    description:
      "Reads developer-scoped job status or a bounded independent numerical certificate without promoting it into implementation, theory, empirical, physical, or terminal authority.",
    action_id: "read_independent_numerical_verification_result",
    mode: "read",
    requires_confirmation: false,
    requires_source: false,
    permission_profile_required: "read",
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
    output_observation_schema: RESULT_SCHEMA,
    observation_schema: RESULT_SCHEMA,
    safety_tags: [
      "developer_only",
      "read_only_evidence",
      "independent_numerical_certificate",
      "requires_evidence_reentry",
      "non_terminal",
      "no_shell",
      "no_code_mutation",
    ],
  };

export const theoryIndependentNumericalManifests = [
  theoryIndependentNumericalPrepareRequestManifest,
  theoryIndependentNumericalPlanManifest,
  theoryIndependentNumericalStartManifest,
  theoryIndependentNumericalReadResultManifest,
] as const;

const string = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;
const pollAttempt = (value: unknown): number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : 0;
const numericalPlanAffordance = (
  preparedRequestId: string,
): Record<string, unknown> => ({
  schema: "helix.provider_next_affordance.v1",
  affordance_id: `independent-numerical-verifier:plan:${preparedRequestId}`,
  capability: THEORY_INDEPENDENT_NUMERICAL_PLAN_CAPABILITY,
  mode: "read",
  reason: "server_owned_independent_numerical_request_prepared",
  requires_confirmation: false,
  executes_automatically: false,
  lane_request: {
    capability: THEORY_INDEPENDENT_NUMERICAL_PLAN_CAPABILITY,
    prepared_request_id: preparedRequestId,
  },
  terminal_eligible: false,
  assistant_answer: false,
  raw_content_included: false,
});
const numericalStartAffordance = (planId: string): Record<string, unknown> => ({
  schema: "helix.provider_next_affordance.v1",
  affordance_id: `independent-numerical-verifier:start:${planId}`,
  capability: THEORY_INDEPENDENT_NUMERICAL_START_CAPABILITY,
  mode: "act",
  reason:
    "exact_independent_numerical_plan_ready_for_confirmed_evidence_only_start",
  requires_confirmation: true,
  executes_automatically: false,
  lane_request: {
    capability: THEORY_INDEPENDENT_NUMERICAL_START_CAPABILITY,
    plan_id: planId,
  },
  terminal_eligible: false,
  assistant_answer: false,
  raw_content_included: false,
});
const numericalReadResultAffordance = (
  jobId: string,
  nextPollAttempt: number,
): Record<string, unknown> => ({
  schema: "helix.provider_next_affordance.v1",
  affordance_id: `independent-numerical-verifier:read-result:${jobId}:${nextPollAttempt}`,
  capability: THEORY_INDEPENDENT_NUMERICAL_READ_RESULT_CAPABILITY,
  mode: "read",
  reason: "read_evidence_only_independent_numerical_job_status",
  requires_confirmation: false,
  executes_automatically: false,
  lane_request: {
    capability: THEORY_INDEPENDENT_NUMERICAL_READ_RESULT_CAPABILITY,
    job_id: jobId,
    poll_attempt: nextPollAttempt,
  },
  terminal_eligible: false,
  assistant_answer: false,
  raw_content_included: false,
});
export type TheoryIndependentNumericalGatewayExecution = {
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

export async function executeTheoryIndependentNumericalGatewayCapability(input: {
  capabilityId: string;
  args: Record<string, unknown>;
  accountType: HelixAccountType;
  profileId?: string | null;
  sessionId?: string | null;
  turnId?: string | null;
  authoritativeEvidenceArtifacts?: unknown[];
  approvalReceipt?: unknown;
  approvalToken?: string | null;
}): Promise<TheoryIndependentNumericalGatewayExecution> {
  if (input.accountType !== "developer") {
    const observation = {
      schema: "casimir.theory_independent_numerical.account_blocked.v1",
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
      summary:
        "Independent numerical verification is restricted to developer accounts.",
      observation,
      missingRequirements: [
        {
          code: "developer_account_required",
          message:
            "Use a trusted developer account for experimental numerical replay.",
          repair_action: "ask_user",
        },
      ],
      error: "developer_account_required",
    };
  }

  if (
    input.capabilityId === THEORY_INDEPENDENT_NUMERICAL_READ_RESULT_CAPABILITY
  ) {
    const currentPollAttempt = pollAttempt(input.args.poll_attempt);
    const result = readCasimirIndependentNumericalVerifierJobResultV1({
      accountType: input.accountType,
      profileId: input.profileId,
      jobId: string(input.args.job_id ?? input.args.jobId),
    });
    const running = result.status === "running";
    const completed = result.status === "completed";
    const blocked = result.status === "blocked";
    const failed = result.status === "failed";
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
        ? "independent_numerical_result_read_blocked"
        : "developer_scoped_independent_numerical_result_read",
      ...(blocked || failed
        ? {
            blockedReason:
              result.issues[0] ?? "independent_numerical_result_failed",
          }
        : {}),
      summary: running
        ? "The independent numerical replay job is still running."
        : completed
          ? `The replay produced a ${result.certificate?.status ?? "completed"} bounded evidence certificate.`
          : "The independent numerical result could not be read.",
      observation: {
        ...result,
        schema: RESULT_SCHEMA,
        output_role: "evidence_for_bounded_synthesis",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
        next_affordances:
          running && result.jobId
            ? [
                numericalReadResultAffordance(
                  result.jobId,
                  currentPollAttempt + 1,
                ),
              ]
            : [],
      },
      missingRequirements: result.issues.map((code: string) => ({
        code,
        message: `Numerical result requires repair: ${code}.`,
        repair_action: blocked ? "ask_user" : "repair",
      })),
      ...(blocked || failed
        ? { error: result.issues[0] ?? "independent_numerical_result_failed" }
        : {}),
    };
  }

  if (
    input.capabilityId === THEORY_INDEPENDENT_NUMERICAL_START_CAPABILITY &&
    string(input.approvalToken)
  ) {
    const issue = "runtime_approval_legacy_token_rejected";
    return {
      ok: false,
      status: "blocked",
      admissionStatus: "blocked",
      admissionReason: "independent_numerical_start_blocked",
      blockedReason: issue,
      summary:
        "The numerical replay was not started because legacy confirmation strings are not trusted runtime receipts.",
      observation: {
        schema: START_SCHEMA,
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

  if (
    input.capabilityId ===
    THEORY_INDEPENDENT_NUMERICAL_PREPARE_REQUEST_CAPABILITY
  ) {
    const result = await prepareCasimirIndependentNumericalVerifierRequestV1({
      accountType: input.accountType,
      profileId: input.profileId,
      turnId: input.turnId,
      authoritativeEvidenceArtifacts: input.authoritativeEvidenceArtifacts,
      catalogEntryId: string(
        input.args.catalog_entry_id ?? input.args.catalogEntryId,
      ),
      procedureId: string(input.args.procedure_id ?? input.args.procedureId),
      procedureSha256: string(
        input.args.procedure_sha256 ?? input.args.procedureSha256,
      ),
    });
    return {
      ok: result.ok,
      status: result.ok ? "succeeded" : "blocked",
      admissionStatus: result.ok ? "admitted" : "blocked",
      admissionReason: result.ok
        ? "server_owned_numerical_request_prepared"
        : "independent_numerical_request_preparation_blocked",
      ...(result.ok ? {} : { blockedReason: result.issues[0] }),
      summary: result.ok
        ? "The server-owned numerical execution catalog prepared and sealed the exact replay inputs."
        : result.issues.includes("numerical_execution_catalog_unconfigured")
          ? "The numerical request was not prepared because no trusted server-owned execution catalog is configured."
          : "The numerical execution catalog could not prepare the requested entry.",
      observation: {
        ...result,
        schema: PREPARED_REQUEST_SCHEMA,
        output_role: "candidate_next_step",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
        next_affordances:
          result.ok && result.preparedRequestId
            ? [numericalPlanAffordance(result.preparedRequestId)]
            : [],
      },
      missingRequirements: result.issues.map((code: string) => ({
        code,
        message:
          code === "numerical_execution_catalog_unconfigured"
            ? "Install a trusted server-owned numerical execution catalog; policy and executable paths cannot be supplied by the model or user."
            : `Numerical request preparation requires repair: ${code}.`,
        repair_action: "repair",
      })),
      ...(result.ok ? {} : { error: result.issues[0] }),
    };
  }

  if (input.capabilityId === THEORY_INDEPENDENT_NUMERICAL_PLAN_CAPABILITY) {
    const result = await planCasimirIndependentNumericalVerifierJobV1({
      accountType: input.accountType,
      profileId: input.profileId,
      preparedRequestId: string(
        input.args.prepared_request_id ?? input.args.preparedRequestId,
      ),
    });
    return {
      ok: result.ok,
      status: result.ok ? "succeeded" : "blocked",
      admissionStatus: result.ok ? "admitted" : "blocked",
      admissionReason: result.ok
        ? "independent_numerical_preflight_ready"
        : "independent_numerical_preflight_blocked",
      ...(result.ok ? {} : { blockedReason: result.issues[0] }),
      summary: result.ok
        ? "The exact numerical inputs passed developer-only preflight; confirmation is required before execution."
        : "The exact numerical inputs failed preflight.",
      observation: {
        ...result,
        schema: PLAN_SCHEMA,
        output_role: "candidate_next_step",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
        next_affordances:
          result.ok && result.planId
            ? [numericalStartAffordance(result.planId)]
            : [],
      },
      missingRequirements: result.issues.map((code: string) => ({
        code,
        message: `Numerical preflight requires repair: ${code}.`,
        repair_action: "repair",
      })),
      ...(result.ok ? {} : { error: result.issues[0] }),
    };
  }

  const result = await startCasimirIndependentNumericalVerifierJobV1({
    accountType: input.accountType,
    profileId: input.profileId,
    planId: string(input.args.plan_id ?? input.args.planId),
    sessionId: input.sessionId,
    turnId: input.turnId,
    approvalReceipt: input.approvalReceipt,
    approvalToken: input.approvalToken,
  });
  const needsConfirmation = result.status === "needs_confirmation";
  const blocked = result.status === "blocked";
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
        ? "independent_numerical_start_blocked"
        : "confirmed_independent_numerical_job_started",
    ...(blocked || needsConfirmation
      ? { blockedReason: result.issues[0] }
      : {}),
    summary: needsConfirmation
      ? "The numerical replay was not started because runtime confirmation is required."
      : blocked
        ? "The numerical replay job was not started."
        : "The confirmed numerical replay job started; read_result is required to obtain evidence.",
    observation: {
      ...result,
      schema: START_SCHEMA,
      output_role: "candidate_next_step",
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      next_affordances:
        result.ok && result.status === "running" && result.jobId
          ? [numericalReadResultAffordance(result.jobId, 0)]
          : [],
    },
    missingRequirements: result.issues.map((code: string) => ({
      code,
      message:
        code === "runtime_approval_receipt_required"
          ? "Obtain explicit user confirmation and an exact receipt through the trusted runtime approval lifecycle."
          : code === "runtime_approval_receipt_issuer_unconfigured"
            ? "Configure a trusted Codex runtime confirmation-receipt verifier; Helix does not issue approval receipts."
            : `Numerical replay start requires repair: ${code}.`,
      repair_action:
        code === "runtime_approval_receipt_required" ? "ask_user" : "repair",
    })),
    ...(blocked || needsConfirmation ? { error: result.issues[0] } : {}),
  };
}
