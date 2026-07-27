import type { HelixAccountType } from "@shared/helix-account-session";

import {
  inspectCasimirFormalRuntimeCanaryV1,
  planCasimirFormalRuntimeCanaryV1,
  readCasimirFormalRuntimeCanaryResultV1,
  startCasimirFormalRuntimeCanaryV1,
  THEORY_RUNTIME_CANARY_INSPECT_CAPABILITY,
  THEORY_RUNTIME_CANARY_PLAN_CAPABILITY,
  THEORY_RUNTIME_CANARY_READ_RESULT_CAPABILITY,
  THEORY_RUNTIME_CANARY_START_CAPABILITY,
} from "../../theory/casimir-formal-runtime-canary-service";
import type { HelixWorkstationCapabilityManifest } from "./types";

export {
  THEORY_RUNTIME_CANARY_INSPECT_CAPABILITY,
  THEORY_RUNTIME_CANARY_PLAN_CAPABILITY,
  THEORY_RUNTIME_CANARY_READ_RESULT_CAPABILITY,
  THEORY_RUNTIME_CANARY_START_CAPABILITY,
};

export const THEORY_RUNTIME_CANARY_CAPABILITIES = [
  THEORY_RUNTIME_CANARY_INSPECT_CAPABILITY,
  THEORY_RUNTIME_CANARY_PLAN_CAPABILITY,
  THEORY_RUNTIME_CANARY_START_CAPABILITY,
  THEORY_RUNTIME_CANARY_READ_RESULT_CAPABILITY,
] as const;

const INSPECTION_OBSERVATION_SCHEMA =
  "casimir.formal_runtime_canary.inspection_observation.v1" as const;
const PLAN_OBSERVATION_SCHEMA =
  "casimir.formal_runtime_canary.plan_observation.v1" as const;
const START_OBSERVATION_SCHEMA =
  "casimir.formal_runtime_canary.start_observation.v1" as const;
const RESULT_OBSERVATION_SCHEMA =
  "casimir.formal_runtime_canary.result_observation.v1" as const;

const baseSafetyTags = [
  "developer_only",
  "non_scientific_runtime_self_test",
  "formal_closure_ineligible",
  "non_terminal",
  "no_shell",
  "no_code_mutation",
  "does_not_validate_scientific_truth",
] as const;

export const theoryRuntimeCanaryInspectManifest: HelixWorkstationCapabilityManifest =
  {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: THEORY_RUNTIME_CANARY_INSPECT_CAPABILITY,
    label: "Inspect formal runtime canary",
    description:
      "Inspects whether the exact no-import Lean runtime self-test and trusted approval dependencies are configured. It performs no execution and has no scientific or closure authority.",
    panel_id: "theory-badge-graph",
    action_id: "inspect_formal_runtime_canary",
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
      properties: {
        source_target_intent: { type: "object" },
      },
    },
    output_observation_schema: INSPECTION_OBSERVATION_SCHEMA,
    observation_schema: INSPECTION_OBSERVATION_SCHEMA,
    safety_tags: [...baseSafetyTags, "read_only_readiness_inspection"],
    assistant_answer: false,
    raw_content_included: false,
  };

export const theoryRuntimeCanaryPlanManifest: HelixWorkstationCapabilityManifest =
  {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: THEORY_RUNTIME_CANARY_PLAN_CAPABILITY,
    label: "Plan formal runtime canary",
    description:
      "Preflights the exact server-owned Lean self-test and produces a hash-bound plan. It never issues approval or starts a process.",
    panel_id: "theory-badge-graph",
    action_id: "plan_formal_runtime_canary",
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
      properties: {
        source_target_intent: { type: "object" },
      },
    },
    output_observation_schema: PLAN_OBSERVATION_SCHEMA,
    observation_schema: PLAN_OBSERVATION_SCHEMA,
    safety_tags: [...baseSafetyTags, "read_only_preflight"],
    assistant_answer: false,
    raw_content_included: false,
  };

export const theoryRuntimeCanaryStartManifest: HelixWorkstationCapabilityManifest =
  {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: THEORY_RUNTIME_CANARY_START_CAPABILITY,
    label: "Start formal runtime canary",
    description:
      "Starts only the exact no-import Lean self-test after a trusted, single-use runtime approval receipt is rechecked against the plan and current turn.",
    panel_id: "theory-badge-graph",
    action_id: "start_formal_runtime_canary",
    mode: "act",
    mutating: false,
    code_mutation: false,
    shell_access: false,
    requires_confirmation: true,
    requires_source: false,
    terminal_eligible: false,
    permission_profile_required: "act",
    post_tool_model_step_required: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["plan_id"],
      properties: {
        plan_id: { type: "string" },
        source_target_intent: { type: "object" },
      },
    },
    output_observation_schema: START_OBSERVATION_SCHEMA,
    observation_schema: START_OBSERVATION_SCHEMA,
    safety_tags: [
      ...baseSafetyTags,
      "requires_confirmation",
      "trusted_receipt_required",
      "atomic_replay_ledger_required",
      "pinned_lean_replay",
    ],
    assistant_answer: false,
    raw_content_included: false,
  };

export const theoryRuntimeCanaryReadResultManifest: HelixWorkstationCapabilityManifest =
  {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: THEORY_RUNTIME_CANARY_READ_RESULT_CAPABILITY,
    label: "Read formal runtime canary result",
    description:
      "Reads the developer-scoped Lean runtime self-test observation. Even a passed replay is non-scientific, closure-ineligible, and nonterminal.",
    panel_id: "theory-badge-graph",
    action_id: "read_formal_runtime_canary_result",
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
    output_observation_schema: RESULT_OBSERVATION_SCHEMA,
    observation_schema: RESULT_OBSERVATION_SCHEMA,
    safety_tags: [
      ...baseSafetyTags,
      "read_only_runtime_observation",
      "requires_evidence_reentry",
    ],
    assistant_answer: false,
    raw_content_included: false,
  };

export const theoryRuntimeCanaryManifests = [
  theoryRuntimeCanaryInspectManifest,
  theoryRuntimeCanaryPlanManifest,
  theoryRuntimeCanaryStartManifest,
  theoryRuntimeCanaryReadResultManifest,
] as const;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readPollAttempt = (value: unknown): number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : 0;

const nextAffordance = (input: {
  capability: string;
  id: string;
  mode: "read" | "act";
  reason: string;
  args?: Record<string, unknown>;
  requiresConfirmation?: boolean;
}): Record<string, unknown> => ({
  schema: "helix.provider_next_affordance.v1",
  affordance_id: input.id,
  capability: input.capability,
  mode: input.mode,
  reason: input.reason,
  requires_confirmation: input.requiresConfirmation ?? false,
  executes_automatically: false,
  lane_request: {
    capability: input.capability,
    ...(input.args ?? {}),
  },
  terminal_eligible: false,
  assistant_answer: false,
  raw_content_included: false,
});

const missingRequirement = (code: string) => ({
  code,
  message:
    code === "runtime_approval_host_unconfigured"
      ? "Connect a trusted Codex runtime approval host; Helix cannot approve or sign its own execution."
      : code === "runtime_approval_receipt_required"
        ? "Obtain explicit user confirmation through the trusted runtime approval lifecycle."
        : `Formal runtime canary dependency requires repair: ${code}.`,
  repair_action:
    code === "runtime_approval_receipt_required" ||
    code === "developer_account_required"
      ? ("ask_user" as const)
      : ("repair" as const),
});

export type TheoryRuntimeCanaryGatewayExecution = {
  ok: boolean;
  status:
    | "succeeded"
    | "blocked"
    | "needs_confirmation"
    | "failed"
    | "client_pending";
  admissionStatus: "admitted" | "blocked";
  admissionReason: string;
  blockedReason?: string;
  summary: string;
  observation: unknown;
  missingRequirements: Array<ReturnType<typeof missingRequirement>>;
  error?: string;
};

const observationAuthority = {
  observation_kind: "formal_runtime_canary_evidence",
  output_role: "non_scientific_runtime_readiness_evidence",
  non_scientific_runtime_self_test: true,
  formal_closure_eligible: false,
  terminal_eligible: false,
  post_tool_model_step_required: true,
  assistant_answer: false,
  raw_content_included: false,
} as const;

const blockedExecution = (input: {
  schema: string;
  issues: string[];
  reason: string;
  summary: string;
  observation?: Record<string, unknown>;
}): TheoryRuntimeCanaryGatewayExecution => {
  const issue = input.issues[0] ?? "formal_runtime_canary_blocked";
  return {
    ok: false,
    status: "blocked",
    admissionStatus: "blocked",
    admissionReason: input.reason,
    blockedReason: issue,
    summary: input.summary,
    observation: {
      schema: input.schema,
      ok: false,
      status: "blocked",
      issues: input.issues,
      next_affordances: [],
      ...input.observation,
      ...observationAuthority,
    },
    missingRequirements: input.issues.map(missingRequirement),
    error: issue,
  };
};

export async function executeTheoryRuntimeCanaryGatewayCapability(input: {
  capabilityId: string;
  args: Record<string, unknown>;
  accountType: HelixAccountType;
  profileId?: string | null;
  sessionId?: string | null;
  turnId?: string | null;
  approvalReceipt?: unknown;
  approvalToken?: string | null;
}): Promise<TheoryRuntimeCanaryGatewayExecution> {
  if (input.accountType !== "developer") {
    return blockedExecution({
      schema: "casimir.formal_runtime_canary.account_blocked.v1",
      issues: ["developer_account_required"],
      reason: "developer_account_required",
      summary: "The formal runtime canary is restricted to developer accounts.",
    });
  }

  if (input.capabilityId === THEORY_RUNTIME_CANARY_INSPECT_CAPABILITY) {
    const result = await inspectCasimirFormalRuntimeCanaryV1({
      accountType: input.accountType,
      profileId: input.profileId,
    });
    const observation = {
      ...result,
      schema: INSPECTION_OBSERVATION_SCHEMA,
      next_affordances: result.ok
        ? [
            nextAffordance({
              capability: THEORY_RUNTIME_CANARY_PLAN_CAPABILITY,
              id: "formal-runtime-canary:plan",
              mode: "read",
              reason: "exact_runtime_self_test_dependencies_ready",
            }),
          ]
        : [],
      ...observationAuthority,
    };
    return {
      ok: result.ok,
      status: result.ok ? "succeeded" : "blocked",
      admissionStatus: result.ok ? "admitted" : "blocked",
      admissionReason: result.ok
        ? "formal_runtime_canary_ready"
        : "formal_runtime_canary_dependencies_blocked",
      ...(result.ok ? {} : { blockedReason: result.issues[0] }),
      summary: result.ok
        ? "The exact non-scientific Lean runtime self-test and trust dependencies are ready for preflight."
        : "The formal runtime canary remains fail-closed until its server-owned execution and approval dependencies are configured.",
      observation,
      missingRequirements: result.issues.map(missingRequirement),
      ...(result.ok ? {} : { error: result.issues[0] }),
    };
  }

  if (input.capabilityId === THEORY_RUNTIME_CANARY_PLAN_CAPABILITY) {
    const result = await planCasimirFormalRuntimeCanaryV1({
      accountType: input.accountType,
      profileId: input.profileId,
    });
    const observation = {
      ...result,
      schema: PLAN_OBSERVATION_SCHEMA,
      next_affordances:
        result.ok && result.planId
          ? [
              nextAffordance({
                capability: THEORY_RUNTIME_CANARY_START_CAPABILITY,
                id: `formal-runtime-canary:start:${result.planId}`,
                mode: "act",
                reason:
                  "exact_runtime_self_test_plan_ready_for_confirmed_start",
                args: { plan_id: result.planId },
                requiresConfirmation: true,
              }),
            ]
          : [],
      ...observationAuthority,
    };
    return {
      ok: result.ok,
      status: result.ok ? "succeeded" : "blocked",
      admissionStatus: result.ok ? "admitted" : "blocked",
      admissionReason: result.ok
        ? "formal_runtime_canary_plan_ready"
        : "formal_runtime_canary_plan_blocked",
      ...(result.ok ? {} : { blockedReason: result.issues[0] }),
      summary: result.ok
        ? "The exact no-import Lean self-test passed preflight; explicit runtime confirmation is required before execution."
        : "The formal runtime canary could not produce an executable plan.",
      observation,
      missingRequirements: result.issues.map(missingRequirement),
      ...(result.ok ? {} : { error: result.issues[0] }),
    };
  }

  if (input.capabilityId === THEORY_RUNTIME_CANARY_READ_RESULT_CAPABILITY) {
    const pollAttempt = readPollAttempt(input.args.poll_attempt);
    const result = await readCasimirFormalRuntimeCanaryResultV1({
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
      schema: RESULT_OBSERVATION_SCHEMA,
      next_affordances:
        running && result.jobId
          ? [
              nextAffordance({
                capability: THEORY_RUNTIME_CANARY_READ_RESULT_CAPABILITY,
                id: `formal-runtime-canary:read:${result.jobId}:${pollAttempt + 1}`,
                mode: "read",
                reason: "read_non_scientific_runtime_canary_job_status",
                args: {
                  job_id: result.jobId,
                  poll_attempt: pollAttempt + 1,
                },
              }),
            ]
          : [],
      ...observationAuthority,
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
        ? "formal_runtime_canary_result_blocked"
        : "formal_runtime_canary_result_observed",
      ...(blocked || failed
        ? {
            blockedReason:
              result.issues[0] ?? "formal_runtime_canary_replay_failed",
          }
        : {}),
      summary: running
        ? "The non-scientific Lean runtime canary is still running."
        : completed
          ? "The Lean runtime self-test completed; this is runtime readiness evidence only, not formal or scientific closure."
          : "The Lean runtime self-test result could not be admitted.",
      observation,
      missingRequirements: result.issues.map(missingRequirement),
      ...(blocked || failed
        ? { error: result.issues[0] ?? "formal_runtime_canary_replay_failed" }
        : {}),
    };
  }

  const result = await startCasimirFormalRuntimeCanaryV1({
    accountType: input.accountType,
    profileId: input.profileId,
    sessionId: input.sessionId,
    turnId: input.turnId,
    planId: readString(input.args.plan_id ?? input.args.planId),
    approvalReceipt: input.approvalReceipt,
    approvalToken: input.approvalToken,
  });
  const needsConfirmation = result.status === "needs_confirmation";
  const blocked = result.status === "blocked";
  const observation = {
    ...result,
    schema: START_OBSERVATION_SCHEMA,
    next_affordances:
      result.ok && result.status === "running" && result.jobId
        ? [
            nextAffordance({
              capability: THEORY_RUNTIME_CANARY_READ_RESULT_CAPABILITY,
              id: `formal-runtime-canary:read:${result.jobId}:0`,
              mode: "read",
              reason: "read_non_scientific_runtime_canary_job_status",
              args: { job_id: result.jobId, poll_attempt: 0 },
            }),
          ]
        : [],
    ...observationAuthority,
  };
  return {
    ok: result.ok,
    status: needsConfirmation
      ? "needs_confirmation"
      : blocked
        ? "blocked"
        : "client_pending",
    admissionStatus: needsConfirmation || blocked ? "blocked" : "admitted",
    admissionReason: needsConfirmation
      ? "runtime_confirmation_required"
      : blocked
        ? "formal_runtime_canary_start_blocked"
        : "confirmed_formal_runtime_canary_started",
    ...(needsConfirmation || blocked
      ? { blockedReason: result.issues[0] }
      : {}),
    summary: needsConfirmation
      ? "The runtime canary was not started because explicit confirmation is required."
      : blocked
        ? "The runtime canary was not started."
        : "The confirmed no-import Lean runtime self-test started; read_result is required to observe it.",
    observation,
    missingRequirements: result.issues.map(missingRequirement),
    ...(needsConfirmation || blocked ? { error: result.issues[0] } : {}),
  };
}
