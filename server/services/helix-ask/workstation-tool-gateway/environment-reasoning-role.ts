import crypto from "node:crypto";
import {
  HELIX_ENVIRONMENT_REASONING_ROLE_ARBITRATE_CAPABILITY,
  HELIX_ENVIRONMENT_REASONING_ROLE_DISPOSITION_CAPABILITY,
  HELIX_ENVIRONMENT_REASONING_ROLE_INSPECT_CAPABILITY,
  HELIX_ENVIRONMENT_REASONING_ROLE_RECORD_CAPABILITY,
  helixEnvironmentReasoningRoleSha256,
  helixEnvironmentReasoningRoleArbitrateRequestSchema,
  helixEnvironmentReasoningRoleDispositionRequestSchema,
  helixEnvironmentReasoningRoleRecordRequestSchema,
  type HelixEnvironmentReasoningRoleProjection,
} from "@shared/helix-environment-reasoning-role";
import type { HelixAgentRuntimeId } from "@shared/helix-agent-runtime";
import { resolveEnvironmentActionAuthorityContext } from "../../environment-connectors/actions";
import {
  environmentReasoningRoleStore,
  isEnvironmentReasoningRoleError,
  type EnvironmentReasoningRoleStore,
} from "../../environment-connectors/reasoning-roles/environment-reasoning-role-store";
import {
  auditEnvironmentReasoningRoleContinuity,
  type EnvironmentReasoningRoleContinuityAudit,
} from "../../environment-connectors/reasoning-roles/environment-reasoning-role-audit";
import { listRoomEnvironmentProjections } from "../../environment-connectors/subjects";
import { readSharedRealtimeRoomMembership } from "../realtime-room/room-store";
import type { HelixWorkstationGatewayAccountContext } from "./account-policy";
import type { HelixWorkstationCapabilityManifest } from "./types";

export const HELIX_ENVIRONMENT_REASONING_ROLE_OBSERVATION_SCHEMA =
  "helix.environment_reasoning_role_observation.v1" as const;

const commonSafetyTags = [
  "selected_runtime_provider_remains_root",
  "revision_bound_shadow_role",
  "append_only_invalidation",
  "principal_adoption_required",
  "one_execution_arbiter",
  "no_execution_authority",
  "no_answer_authority",
  "current_turn_evidence_reentry_required",
  "no_shell",
  "no_code_mutation",
  "non_terminal",
];

const commonProperties = {
  goal_id: { type: "string", minLength: 1, maxLength: 320 },
  expected_goal_revision: { type: "integer", minimum: 1 },
  expected_ledger_revision: { type: "integer", minimum: 0 },
  observation_revision: { type: "integer", minimum: 0 },
} as const;

export const environmentReasoningRoleManifests: HelixWorkstationCapabilityManifest[] = [
  {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: HELIX_ENVIRONMENT_REASONING_ROLE_RECORD_CAPABILITY,
    label: "Record concurrent environment reasoning output",
    description:
      "Record one perception, prospective-planning, or verification output against the exact current durable-goal and environment observation revisions. This is shadow evidence only: it cannot execute, reserve authority, or answer. Use only when the principal Runtime Codex intentionally prepares supporting work for its own current turn.",
    panel_id: null,
    action_id: "room.environment.reasoning_role.record",
    mode: "act",
    mutating: true,
    code_mutation: false,
    shell_access: false,
    requires_confirmation: false,
    requires_source: true,
    terminal_eligible: false,
    permission_profile_required: "act",
    post_tool_model_step_required: true,
    input_schema: {
      type: "object",
      properties: {
        ...commonProperties,
        input_evidence_refs: {
          type: "array",
          minItems: 1,
          maxItems: 256,
          items: { type: "string" },
        },
        payload: {
          type: "object",
          description:
            "One typed helix.environment_reasoning_role payload for perception, prospective_planning, or verification.",
        },
        expires_in_seconds: { type: "integer", minimum: 5, maximum: 600 },
      },
      required: [
        "goal_id",
        "expected_goal_revision",
        "expected_ledger_revision",
        "observation_revision",
        "input_evidence_refs",
        "payload",
        "expires_in_seconds",
      ],
      additionalProperties: false,
    },
    output_observation_schema: HELIX_ENVIRONMENT_REASONING_ROLE_OBSERVATION_SCHEMA,
    observation_schema: HELIX_ENVIRONMENT_REASONING_ROLE_OBSERVATION_SCHEMA,
    safety_tags: commonSafetyTags,
    assistant_answer: false,
    raw_content_included: false,
  },
  {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: HELIX_ENVIRONMENT_REASONING_ROLE_INSPECT_CAPABILITY,
    label: "Inspect concurrent environment reasoning outputs",
    description:
      "Reconstruct the append-only G6 role-output, invalidation, principal-disposition, arbitration, execution-link, and measured-result ledger. The projection is nonterminal evidence for the principal Runtime Codex.",
    panel_id: null,
    action_id: "room.environment.reasoning_role.inspect",
    mode: "read",
    mutating: false,
    code_mutation: false,
    shell_access: false,
    requires_confirmation: false,
    requires_source: true,
    terminal_eligible: false,
    permission_profile_required: "observe",
    post_tool_model_step_required: true,
    input_schema: {
      type: "object",
      properties: { goal_id: commonProperties.goal_id },
      required: ["goal_id"],
      additionalProperties: false,
    },
    output_observation_schema: HELIX_ENVIRONMENT_REASONING_ROLE_OBSERVATION_SCHEMA,
    observation_schema: HELIX_ENVIRONMENT_REASONING_ROLE_OBSERVATION_SCHEMA,
    safety_tags: commonSafetyTags,
    assistant_answer: false,
    raw_content_included: false,
  },
  {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: HELIX_ENVIRONMENT_REASONING_ROLE_DISPOSITION_CAPABILITY,
    label: "Record principal disposition of a supporting role output",
    description:
      "Record whether the exact principal Runtime Codex turn adopted, revised, ignored, or rejected one supporting output. Adoption remains non-executing and does not grant permission.",
    panel_id: null,
    action_id: "room.environment.reasoning_role.disposition",
    mode: "act",
    mutating: true,
    code_mutation: false,
    shell_access: false,
    requires_confirmation: false,
    requires_source: true,
    terminal_eligible: false,
    permission_profile_required: "act",
    post_tool_model_step_required: true,
    input_schema: {
      type: "object",
      properties: {
        goal_id: commonProperties.goal_id,
        expected_ledger_revision: { type: "integer", minimum: 1 },
        role_output_id: { type: "string", minLength: 1, maxLength: 320 },
        disposition: {
          type: "string",
          enum: ["adopted", "revised", "ignored", "rejected"],
        },
        adopted_capability_id: { type: ["string", "null"] },
        adopted_capability_arguments: { type: ["object", "null"] },
        rationale_summary: { type: "string", minLength: 1, maxLength: 4_000 },
      },
      required: [
        "goal_id",
        "expected_ledger_revision",
        "role_output_id",
        "disposition",
        "adopted_capability_id",
        "adopted_capability_arguments",
        "rationale_summary",
      ],
      additionalProperties: false,
    },
    output_observation_schema: HELIX_ENVIRONMENT_REASONING_ROLE_OBSERVATION_SCHEMA,
    observation_schema: HELIX_ENVIRONMENT_REASONING_ROLE_OBSERVATION_SCHEMA,
    safety_tags: commonSafetyTags,
    assistant_answer: false,
    raw_content_included: false,
  },
  {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: HELIX_ENVIRONMENT_REASONING_ROLE_ARBITRATE_CAPABILITY,
    label: "Arbitrate current concurrent environment proposal",
    description:
      "Invalidate stale supporting outputs and select at most one current principal-adopted proposal for the existing environment action admission path. This operation does not execute the selected capability.",
    panel_id: null,
    action_id: "room.environment.reasoning_role.arbitrate",
    mode: "act",
    mutating: true,
    code_mutation: false,
    shell_access: false,
    requires_confirmation: false,
    requires_source: true,
    terminal_eligible: false,
    permission_profile_required: "act",
    post_tool_model_step_required: true,
    input_schema: {
      type: "object",
      properties: {
        ...commonProperties,
        considered_role_output_ids: {
          type: "array",
          minItems: 1,
          maxItems: 64,
          items: { type: "string" },
        },
        selected_role_output_id: { type: ["string", "null"] },
        reason: { type: "string", minLength: 1, maxLength: 4_000 },
      },
      required: [
        "goal_id",
        "expected_goal_revision",
        "expected_ledger_revision",
        "observation_revision",
        "considered_role_output_ids",
        "selected_role_output_id",
        "reason",
      ],
      additionalProperties: false,
    },
    output_observation_schema: HELIX_ENVIRONMENT_REASONING_ROLE_OBSERVATION_SCHEMA,
    observation_schema: HELIX_ENVIRONMENT_REASONING_ROLE_OBSERVATION_SCHEMA,
    safety_tags: commonSafetyTags,
    assistant_answer: false,
    raw_content_included: false,
  },
];

type EnvironmentReasoningRoleObservation = {
  schema: typeof HELIX_ENVIRONMENT_REASONING_ROLE_OBSERVATION_SCHEMA;
  outcome: "recorded" | "fresh" | "blocked" | "failed";
  summary: string;
  operation: string;
  projection: HelixEnvironmentReasoningRoleProjection | null;
  continuity_audit: EnvironmentReasoningRoleContinuityAudit | null;
  evidence_ref: string;
  observed_at: string;
  provenance_valid: boolean;
  eligible_for_current_turn_reentry: boolean;
  content_role: "environment_reasoning_role_observation_not_assistant_answer";
  reentry_required: true;
  execution_authority: false;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type EnvironmentReasoningRoleGatewayExecution = {
  ok: boolean;
  status: "completed" | "blocked" | "failed";
  summary: string;
  observation: EnvironmentReasoningRoleObservation;
  executedArgs?: Record<string, unknown>;
  repairAction?: "repair" | "retry" | "ask_user";
  error?: string;
};

export type EnvironmentReasoningRoleGatewayDependencies = {
  store: Pick<
    EnvironmentReasoningRoleStore,
    "recordOutput" | "inspect" | "recordPrincipalDisposition" | "arbitrate" |
      "linkCompletedPrincipalExecution"
  >;
  listRoomEnvironments: typeof listRoomEnvironmentProjections;
  readMembership: typeof readSharedRealtimeRoomMembership;
  resolveActionContext: typeof resolveEnvironmentActionAuthorityContext;
};

const dependencies = (
  overrides: Partial<EnvironmentReasoningRoleGatewayDependencies> = {},
): EnvironmentReasoningRoleGatewayDependencies => ({
  store: overrides.store ?? environmentReasoningRoleStore,
  listRoomEnvironments:
    overrides.listRoomEnvironments ?? listRoomEnvironmentProjections,
  readMembership: overrides.readMembership ?? readSharedRealtimeRoomMembership,
  resolveActionContext:
    overrides.resolveActionContext ?? resolveEnvironmentActionAuthorityContext,
});

const roomIdFromThread = (threadId: string | null | undefined): string | null => {
  const prefix = "helix-ask:room:";
  const value = threadId?.trim() ?? "";
  return value.startsWith(prefix) ? value.slice(prefix.length).trim() || null : null;
};

const makeObservation = (input: {
  outcome: EnvironmentReasoningRoleObservation["outcome"];
  summary: string;
  operation: string;
  projection?: HelixEnvironmentReasoningRoleProjection | null;
  evidenceRef: string;
  provenanceValid: boolean;
}): EnvironmentReasoningRoleObservation => ({
  schema: HELIX_ENVIRONMENT_REASONING_ROLE_OBSERVATION_SCHEMA,
  outcome: input.outcome,
  summary: input.summary,
  operation: input.operation,
  projection: input.projection ?? null,
  continuity_audit: input.projection
    ? auditEnvironmentReasoningRoleContinuity(input.projection)
    : null,
  evidence_ref: input.evidenceRef,
  observed_at: new Date().toISOString(),
  provenance_valid: input.provenanceValid,
  eligible_for_current_turn_reentry: true,
  content_role: "environment_reasoning_role_observation_not_assistant_answer",
  reentry_required: true,
  execution_authority: false,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

const failed = (
  turnId: string,
  operation: string,
  code: string,
  summary: string,
): EnvironmentReasoningRoleGatewayExecution => ({
  ok: false,
  status:
    code.includes("revision") || code.includes("stale")
      ? "blocked"
      : "failed",
  summary,
  observation: makeObservation({
    outcome: "blocked",
    summary,
    operation,
    evidenceRef: `environment_reasoning_role_failure:${crypto
      .createHash("sha256")
      .update(`${turnId}\n${operation}\n${code}`)
      .digest("hex")
      .slice(0, 48)}`,
    provenanceValid: false,
  }),
  error: code,
  repairAction:
    code.includes("revision") || code.includes("stale")
      ? "retry"
      : code.includes("invalid")
        ? "repair"
        : "ask_user",
});

const selectedParticipant = async (input: {
  dependencies: EnvironmentReasoningRoleGatewayDependencies;
  roomId: string;
  profileId: string;
  account: HelixWorkstationGatewayAccountContext;
}): Promise<string | null> => {
  const membership = await input.dependencies.readMembership({
    roomId: input.roomId,
    profileId: input.profileId,
  });
  if (!membership || membership.roomStatus === "closed") return null;
  const actor = input.account.trusted_turn_actor_context;
  if (!actor) return membership.participantId;
  return ["realtime_voice", "environment_interaction"].includes(actor.origin) &&
    actor.room_id === input.roomId &&
    actor.requester_profile_id === input.profileId &&
    actor.resolution === "resolved" &&
    actor.participant_id
    ? actor.participant_id
    : null;
};

export const linkCompletedEnvironmentReasoningRoleAction = async (input: {
  turnId: string;
  capabilityId: string;
  capabilityArguments: Record<string, unknown>;
  environmentActionRequestId: string;
  environmentActionResultRef: string;
  reentryObservationRef: string;
  accountContext?: HelixWorkstationGatewayAccountContext | null;
  conversationThreadId?: string | null;
  dependencies?: Partial<EnvironmentReasoningRoleGatewayDependencies>;
}): Promise<HelixEnvironmentReasoningRoleProjection | null> => {
  const account = input.accountContext;
  const profileId = account?.profile_id?.trim() ?? "";
  const roomId = roomIdFromThread(input.conversationThreadId);
  if (
    !account?.trusted_account_session ||
    account.account_session?.status !== "active" ||
    account.account_session.profile.profile_id !== profileId ||
    !roomId ||
    !input.turnId.trim()
  ) {
    return null;
  }
  const deps = dependencies(input.dependencies);
  const participantId = await selectedParticipant({
    dependencies: deps,
    roomId,
    profileId,
    account,
  });
  if (!participantId) return null;
  return deps.store.linkCompletedPrincipalExecution({
    profileId,
    participantId,
    roomId,
    principalTurnId: input.turnId,
    capabilityId: input.capabilityId,
    capabilityArguments: input.capabilityArguments,
    environmentActionRequestId: input.environmentActionRequestId,
    environmentActionResultRef: input.environmentActionResultRef,
    reentryObservationRef: input.reentryObservationRef,
  });
};

export const executeEnvironmentReasoningRoleGatewayCapability = async (input: {
  capabilityId: string;
  turnId: string;
  agentRuntime: HelixAgentRuntimeId;
  arguments?: Record<string, unknown>;
  accountContext?: HelixWorkstationGatewayAccountContext | null;
  conversationThreadId?: string | null;
  dependencies?: Partial<EnvironmentReasoningRoleGatewayDependencies>;
}): Promise<EnvironmentReasoningRoleGatewayExecution> => {
  const deps = dependencies(input.dependencies);
  const operation = input.capabilityId;
  const account = input.accountContext;
  const profileId = account?.profile_id?.trim() ?? "";
  const roomId = roomIdFromThread(input.conversationThreadId);
  if (
    !account?.trusted_account_session ||
    !account.account_session ||
    account.account_session.status !== "active" ||
    account.account_session.profile.profile_id !== profileId ||
    !roomId ||
    !input.turnId.trim()
  ) {
    return failed(
      input.turnId,
      operation,
      "reasoning_role_forbidden",
      "Concurrent environment reasoning requires an exact signed-in Shared Live Room principal turn.",
    );
  }
  try {
    const participantId = await selectedParticipant({
      dependencies: deps,
      roomId,
      profileId,
      account,
    });
    if (!participantId) {
      return failed(
        input.turnId,
        operation,
        "reasoning_role_forbidden",
        "The current text author or GPT Live speaker is not an active room participant.",
      );
    }
    const args = input.arguments ?? {};
    if (operation === HELIX_ENVIRONMENT_REASONING_ROLE_INSPECT_CAPABILITY) {
      const goalId = typeof args.goal_id === "string" ? args.goal_id.trim() : "";
      if (!goalId) {
        return failed(input.turnId, operation, "reasoning_role_event_invalid", "An exact goal_id is required.");
      }
      const projection = await deps.store.inspect({ goalId, profileId, participantId });
      const summary = projection
        ? "Concurrent environment reasoning history reconstructed from the canonical role ledger."
        : "No concurrent environment reasoning output has been recorded for this durable goal.";
      return {
        ok: true,
        status: "completed",
        summary,
        observation: makeObservation({
          outcome: "fresh",
          summary,
          operation,
          projection,
          evidenceRef:
            projection?.latest_event_hash ??
            `environment_reasoning_role_empty:${goalId}`,
          provenanceValid: true,
        }),
        executedArgs: { goal_id: goalId },
      };
    }

    const activeEnvironments = (
      await deps.listRoomEnvironments({ roomId, profileId })
    ).filter(
      (entry) => entry.domain === "minecraft" && entry.connection_status === "active",
    );
    if (activeEnvironments.length !== 1) {
      return failed(
        input.turnId,
        operation,
        "reasoning_role_identity_unavailable",
        activeEnvironments.length === 0
          ? "No active Minecraft environment is available for this role operation."
          : "More than one active Minecraft environment is available; exact environment selection is required.",
      );
    }
    const context = await deps.resolveActionContext({
      roomId,
      profileId,
      environmentBindingId: activeEnvironments[0].environment_binding_id,
      participantId,
    });

    let projection: HelixEnvironmentReasoningRoleProjection;
    if (operation === HELIX_ENVIRONMENT_REASONING_ROLE_RECORD_CAPABILITY) {
      const parsed = helixEnvironmentReasoningRoleRecordRequestSchema.safeParse(args);
      if (!parsed.success) {
        return failed(input.turnId, operation, "reasoning_role_event_invalid", parsed.error.issues[0]?.message ?? "The role output request is invalid.");
      }
      projection = await deps.store.recordOutput({
        ownerProfileId: profileId,
        roomId,
        participantId,
        environmentBindingId: context.environmentBindingId,
        subjectNativeId: context.subjectNativeId,
        actionAuthorityId: context.actionAuthorityId,
        runId: null,
        turnId: input.turnId,
        goalId: parsed.data.goal_id,
        expectedGoalRevision: parsed.data.expected_goal_revision,
        expectedLedgerRevision: parsed.data.expected_ledger_revision,
        observationRevision: parsed.data.observation_revision,
        principalTurnId: input.turnId,
        producer: {
          selected_runtime_provider_id: input.agentRuntime,
          supporting_provider_id: input.agentRuntime,
          role_profile_id: `environment.${parsed.data.payload.role_kind}.runtime_native_shadow.v1`,
          role_artifact_version: "v1",
        },
        inputEvidenceRefs: parsed.data.input_evidence_refs,
        payload: parsed.data.payload,
        expiresAt: new Date(Date.now() + parsed.data.expires_in_seconds * 1_000).toISOString(),
      });
    } else if (operation === HELIX_ENVIRONMENT_REASONING_ROLE_DISPOSITION_CAPABILITY) {
      const parsed = helixEnvironmentReasoningRoleDispositionRequestSchema.safeParse(args);
      if (!parsed.success) {
        return failed(input.turnId, operation, "reasoning_role_event_invalid", parsed.error.issues[0]?.message ?? "The principal disposition is invalid.");
      }
      projection = await deps.store.recordPrincipalDisposition({
        goalId: parsed.data.goal_id,
        profileId,
        participantId,
        expectedLedgerRevision: parsed.data.expected_ledger_revision,
        roleOutputId: parsed.data.role_output_id,
        principalTurnId: input.turnId,
        disposition: parsed.data.disposition,
        adoptedCapabilityId: parsed.data.adopted_capability_id,
        adoptedCapabilityArgumentsHash:
          parsed.data.adopted_capability_arguments === null
            ? null
            : helixEnvironmentReasoningRoleSha256(
                parsed.data.adopted_capability_arguments,
              ),
        rationaleSummary: parsed.data.rationale_summary,
      });
    } else if (operation === HELIX_ENVIRONMENT_REASONING_ROLE_ARBITRATE_CAPABILITY) {
      const parsed = helixEnvironmentReasoningRoleArbitrateRequestSchema.safeParse(args);
      if (!parsed.success) {
        return failed(input.turnId, operation, "reasoning_role_event_invalid", parsed.error.issues[0]?.message ?? "The role arbitration request is invalid.");
      }
      projection = await deps.store.arbitrate({
        ownerProfileId: profileId,
        roomId,
        participantId,
        environmentBindingId: context.environmentBindingId,
        subjectNativeId: context.subjectNativeId,
        actionAuthorityId: context.actionAuthorityId,
        runId: null,
        turnId: input.turnId,
        goalId: parsed.data.goal_id,
        expectedGoalRevision: parsed.data.expected_goal_revision,
        expectedLedgerRevision: parsed.data.expected_ledger_revision,
        observationRevision: parsed.data.observation_revision,
        principalTurnId: input.turnId,
        consideredRoleOutputIds: parsed.data.considered_role_output_ids,
        selectedRoleOutputId: parsed.data.selected_role_output_id,
        reason: parsed.data.reason,
      });
    } else {
      return failed(input.turnId, operation, "reasoning_role_event_invalid", "The concurrent environment reasoning capability is not registered.");
    }
    const summary =
      operation === HELIX_ENVIRONMENT_REASONING_ROLE_RECORD_CAPABILITY
        ? "Revision-bound supporting role output recorded as nonterminal evidence."
        : operation === HELIX_ENVIRONMENT_REASONING_ROLE_DISPOSITION_CAPABILITY
          ? "Principal Runtime Codex disposition recorded without execution authority."
          : "Current supporting proposals arbitrated without executing an environment action.";
    return {
      ok: true,
      status: "completed",
      summary,
      observation: makeObservation({
        outcome: "recorded",
        summary,
        operation,
        projection,
        evidenceRef: projection.latest_event_hash,
        provenanceValid: true,
      }),
      executedArgs: {
        goal_id: projection.goal_id,
        ledger_revision: projection.revision,
      },
    };
  } catch (error) {
    if (isEnvironmentReasoningRoleError(error)) {
      return failed(input.turnId, operation, error.code, error.message);
    }
    return failed(
      input.turnId,
      operation,
      "reasoning_role_identity_unavailable",
      error instanceof Error
        ? error.message
        : "Concurrent environment reasoning state is unavailable.",
    );
  }
};
