import type { HelixAccountType } from "@shared/helix-account-session";
import type { CasimirFormalLeanReplayPolicyV1 } from "@shared/contracts/casimir-formal-lean-replay-policy.v1";
import type { CasimirFormalVerificationRequestV1 } from "@shared/contracts/casimir-formal-verification-request.v1";

import {
  planCasimirFormalVerifierJobV1,
  readCasimirFormalVerifierJobResultV1,
  startCasimirFormalVerifierJobV1,
  type CasimirFormalVerifierSealedInputV1,
} from "../../theory/casimir-formal-verifier-job-service";
import type { HelixWorkstationCapabilityManifest } from "./types";

export const THEORY_FORMAL_VERIFIER_PLAN_CAPABILITY =
  "theory-formal-verifier.plan" as const;
export const THEORY_FORMAL_VERIFIER_START_CAPABILITY =
  "theory-formal-verifier.start" as const;
export const THEORY_FORMAL_VERIFIER_READ_RESULT_CAPABILITY =
  "theory-formal-verifier.read_result" as const;

export const THEORY_FORMAL_VERIFIER_CAPABILITIES = [
  THEORY_FORMAL_VERIFIER_PLAN_CAPABILITY,
  THEORY_FORMAL_VERIFIER_START_CAPABILITY,
  THEORY_FORMAL_VERIFIER_READ_RESULT_CAPABILITY,
] as const;

const FORMAL_VERIFIER_PLAN_OBSERVATION_SCHEMA =
  "casimir.theory_formal_verifier.plan_observation.v1" as const;
const FORMAL_VERIFIER_START_OBSERVATION_SCHEMA =
  "casimir.theory_formal_verifier.start_observation.v1" as const;
const FORMAL_VERIFIER_RESULT_OBSERVATION_SCHEMA =
  "casimir.theory_formal_verifier.result_observation.v1" as const;

const sealedInputProperties = {
  request: { type: "object" },
  policy: { type: "object" },
  theorem_source_path: { type: "string" },
  import_source_paths: {
    type: "object",
    additionalProperties: { type: "string" },
  },
} as const;

export const theoryFormalVerifierPlanManifest: HelixWorkstationCapabilityManifest =
  {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: THEORY_FORMAL_VERIFIER_PLAN_CAPABILITY,
    label: "Plan formal theorem replay",
    description:
      "Preflights a hash-bound Casimir formal verification request, replay policy, Lean source, imports, and configured pinned Lean executable. It does not execute Lean or validate scientific truth.",
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
      required: [
        "request",
        "policy",
        "theorem_source_path",
        "import_source_paths",
      ],
      properties: {
        ...sealedInputProperties,
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
      required: [
        "request",
        "policy",
        "theorem_source_path",
        "import_source_paths",
        "plan_id",
      ],
      properties: {
        ...sealedInputProperties,
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

const readStringMap = (value: unknown): Record<string, string> =>
  Object.fromEntries(
    Object.entries(readRecord(value))
      .filter(
        (entry): entry is [string, string] =>
          typeof entry[1] === "string" && Boolean(entry[1].trim()),
      )
      .map(([key, entry]) => [key, entry.trim()]),
  );

const readSealedInput = (
  args: Record<string, unknown>,
): CasimirFormalVerifierSealedInputV1 => ({
  request: readRecord(args.request) as CasimirFormalVerificationRequestV1,
  policy: readRecord(args.policy) as CasimirFormalLeanReplayPolicyV1,
  theoremSourcePath:
    readString(args.theorem_source_path ?? args.theoremSourcePath) ?? "",
  importSourcePaths: readStringMap(
    args.import_source_paths ?? args.importSourcePaths,
  ),
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

  if (input.capabilityId === THEORY_FORMAL_VERIFIER_READ_RESULT_CAPABILITY) {
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
      missingRequirements: result.issues.map((code) => ({
        code,
        message: `Formal replay result requires repair: ${code}.`,
        repair_action: blocked ? "ask_user" : "repair",
      })),
      ...(blocked || failed
        ? { error: result.issues[0] ?? "formal_verifier_result_failed" }
        : {}),
    };
  }

  const sealedInput = readSealedInput(input.args);
  if (input.capabilityId === THEORY_FORMAL_VERIFIER_PLAN_CAPABILITY) {
    const result = await planCasimirFormalVerifierJobV1({
      accountType: input.accountType,
      profileId: input.profileId,
      sealedInput,
    });
    const observation = {
      ...result,
      schema: FORMAL_VERIFIER_PLAN_OBSERVATION_SCHEMA,
      output_role: "candidate_next_step",
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
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
      missingRequirements: result.issues.map((code) => ({
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
    approvalToken: input.approvalToken,
  });
  const needsConfirmation = result.status === "needs_confirmation";
  const blocked = result.status === "blocked";
  const observation = {
    ...result,
    schema: FORMAL_VERIFIER_START_OBSERVATION_SCHEMA,
    output_role: "candidate_next_step",
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
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
    missingRequirements: result.issues.map((code) => ({
      code,
      message:
        code === "runtime_approval_token_required"
          ? "Obtain explicit user confirmation through the runtime approval lifecycle."
          : `Formal replay start requires repair: ${code}.`,
      repair_action:
        code === "runtime_approval_token_required" ? "ask_user" : "repair",
    })),
    ...(blocked || needsConfirmation ? { error: result.issues[0] } : {}),
  };
}
