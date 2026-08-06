import crypto from "node:crypto";
import {
  HELIX_ENVIRONMENT_ACTION_CONTROL_OBSERVATION_SCHEMA,
  type HelixEnvironmentActionControlObservation,
} from "@shared/helix-environment-action";
import {
  HELIX_MINECRAFT_PLAYER_CANCEL_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EMERGENCY_STOP_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_RESUME_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_STATUS_CAPABILITY,
} from "@shared/helix-minecraft-player-capabilities";
import {
  awaitEnvironmentActionControlObservation,
  isEnvironmentActionBrokerError,
  resolveEnvironmentActionWorkflowControlContext,
} from "../../environment-connectors/actions/action-broker";
import {
  emergencyStopEnvironmentActionAuthority,
  requestEnvironmentActionWorkflowControl,
} from "../../environment-connectors/actions/authority-store";
import { readSharedRealtimeRoomMembership } from "../realtime-room/room-store";
import type { HelixWorkstationGatewayAccountContext } from "./account-policy";
import type { HelixWorkstationCapabilityManifest } from "./types";

export const HELIX_ENVIRONMENT_ACTION_CONTROL_GATEWAY_ACTION =
  "room.environment.player_control" as const;

const controlSpecs = [
  {
    capabilityId: HELIX_MINECRAFT_PLAYER_STATUS_CAPABILITY,
    label: "Read Minecraft player workflow status",
    description:
      "Ask the separately paired Fabric client for the current state of one exact player workflow.",
    controlKind: "status" as const,
    mode: "read" as const,
    mutating: false,
    permission: "observe" as const,
  },
  {
    capabilityId: HELIX_MINECRAFT_PLAYER_RESUME_CAPABILITY,
    label: "Resume Minecraft player workflow",
    description:
      "Resume one exact workflow only after the paired player manually interrupted it under a pause policy.",
    controlKind: "resume" as const,
    mode: "act" as const,
    mutating: true,
    permission: "act" as const,
  },
  {
    capabilityId: HELIX_MINECRAFT_PLAYER_CANCEL_CAPABILITY,
    label: "Cancel Minecraft player workflow",
    description:
      "Cancel one exact active player workflow and require the Fabric client to release every asserted control.",
    controlKind: "cancel" as const,
    mode: "act" as const,
    mutating: true,
    permission: "act" as const,
  },
  {
    capabilityId: HELIX_MINECRAFT_PLAYER_EMERGENCY_STOP_CAPABILITY,
    label: "Emergency stop Minecraft player authority",
    description:
      "Use one exact prior workflow to resolve and suspend its player-action authority, stop every active workflow for that paired client, and release every asserted control.",
    controlKind: "emergency_stop" as const,
    mode: "act" as const,
    mutating: true,
    permission: "act" as const,
  },
] as const;

export const environmentActionControlMinecraftManifests:
HelixWorkstationCapabilityManifest[] = controlSpecs.map((spec) => ({
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: spec.capabilityId,
  label: spec.label,
  description:
    `${spec.description} Helix resolves the room, current speaker/player, authority, and connector server-side. The result is evidence for Codex re-entry, never the final answer.`,
  panel_id: null,
  action_id: HELIX_ENVIRONMENT_ACTION_CONTROL_GATEWAY_ACTION,
  mode: spec.mode,
  mutating: spec.mutating,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  permission_profile_required: spec.permission,
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    properties: {
      workflow_ref: {
        type: "string",
        minLength: 1,
        maxLength: 320,
        description:
          "Exact workflow_ref returned by the current or prior admitted player-action observation.",
      },
      reason: {
        type: "string",
        minLength: 1,
        maxLength: 1_000,
        description: "Short semantic reason for this workflow control.",
      },
    },
    required: ["workflow_ref"],
    additionalProperties: false,
  },
  output_observation_schema:
    HELIX_ENVIRONMENT_ACTION_CONTROL_OBSERVATION_SCHEMA,
  observation_schema: HELIX_ENVIRONMENT_ACTION_CONTROL_OBSERVATION_SCHEMA,
  safety_tags: [
    "exact_workflow_identity_required",
    "exact_room_player_authority_required",
    "separate_player_action_pairing",
    "current_turn_evidence_reentry_required",
    "no_automatic_replay",
    "host_access_forbidden",
    "no_shell",
    "no_code_mutation",
    "non_terminal",
  ],
  assistant_answer: false,
  raw_content_included: false,
}));

const roomIdFromThread = (threadId: string | null | undefined): string | null => {
  const prefix = "helix-ask:room:";
  const normalized = threadId?.trim() ?? "";
  return normalized.startsWith(prefix)
    ? normalized.slice(prefix.length).trim() || null
    : null;
};

const specFor = (capabilityId: string) =>
  controlSpecs.find((spec) => spec.capabilityId === capabilityId) ?? null;

const syntheticObservation = (input: {
  capabilityId: string;
  turnId: string;
  workflowRef: string | null;
  summary: string;
}): HelixEnvironmentActionControlObservation => {
  const digest = crypto.createHash("sha256")
    .update(`${input.capabilityId}\n${input.turnId}\n${input.workflowRef ?? ""}`)
    .digest("hex");
  const spec = specFor(input.capabilityId);
  return {
    schema: HELIX_ENVIRONMENT_ACTION_CONTROL_OBSERVATION_SCHEMA,
    control_request_ref: `environment_action_control_uncreated:${digest.slice(0, 40)}`,
    workflow_ref: input.workflowRef,
    control_kind: spec?.controlKind ?? "status",
    outcome: "forbidden",
    summary: input.summary,
    affected_workflow_refs: [],
    workflow_state: null,
    controls_released: false,
    evidence_refs: [],
    evidence_ref: `environment_action_control_failure:${digest.slice(0, 40)}`,
    observed_at: new Date().toISOString(),
    provenance_valid: false,
    eligible_for_current_turn_reentry: false,
    content_role:
      "environment_action_control_observation_not_assistant_answer",
    reentry_required: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

export type EnvironmentActionControlGatewayDependencies = {
  readMembership: typeof readSharedRealtimeRoomMembership;
  resolveContext: typeof resolveEnvironmentActionWorkflowControlContext;
  requestControl: typeof requestEnvironmentActionWorkflowControl;
  emergencyStop: typeof emergencyStopEnvironmentActionAuthority;
  awaitObservation: typeof awaitEnvironmentActionControlObservation;
};

const dependencies = (
  overrides: Partial<EnvironmentActionControlGatewayDependencies> = {},
): EnvironmentActionControlGatewayDependencies => ({
  readMembership: overrides.readMembership ?? readSharedRealtimeRoomMembership,
  resolveContext:
    overrides.resolveContext ?? resolveEnvironmentActionWorkflowControlContext,
  requestControl:
    overrides.requestControl ?? requestEnvironmentActionWorkflowControl,
  emergencyStop:
    overrides.emergencyStop ?? emergencyStopEnvironmentActionAuthority,
  awaitObservation:
    overrides.awaitObservation ?? awaitEnvironmentActionControlObservation,
});

const selectedParticipantId = async (input: {
  deps: EnvironmentActionControlGatewayDependencies;
  roomId: string;
  profileId: string;
  account: HelixWorkstationGatewayAccountContext;
}): Promise<string | null> => {
  const membership = await input.deps.readMembership({
    roomId: input.roomId,
    profileId: input.profileId,
  });
  if (!membership || membership.roomStatus === "closed") return null;
  const actor = input.account.trusted_turn_actor_context;
  if (!actor) return membership.participantId;
  if (
    actor.origin !== "realtime_voice" ||
    actor.room_id !== input.roomId ||
    actor.requester_profile_id !== input.profileId ||
    actor.resolution !== "resolved" ||
    !actor.participant_id
  ) return null;
  return actor.participant_id;
};

export type EnvironmentActionControlGatewayExecution = {
  ok: boolean;
  status: "completed" | "blocked" | "failed";
  summary: string;
  observation: HelixEnvironmentActionControlObservation;
  executedArgs?: Record<string, unknown>;
  repairAction?: "repair" | "retry" | "ask_user";
  error?: string;
};

export const environmentActionControlFailureRepairAction = (
  outcome: HelixEnvironmentActionControlObservation["outcome"],
): "repair" | "retry" | "ask_user" => {
  if (outcome === "stale" || outcome === "failed") return "retry";
  if (outcome === "not_running") return "repair";
  return "ask_user";
};

export const executeEnvironmentActionControlGatewayCapability = async (input: {
  capabilityId: string;
  turnId: string;
  arguments?: Record<string, unknown>;
  accountContext?: HelixWorkstationGatewayAccountContext | null;
  conversationThreadId?: string | null;
  dependencies?: Partial<EnvironmentActionControlGatewayDependencies>;
}): Promise<EnvironmentActionControlGatewayExecution> => {
  const deps = dependencies(input.dependencies);
  const spec = specFor(input.capabilityId);
  const workflowRef = typeof input.arguments?.workflow_ref === "string"
    ? input.arguments.workflow_ref.trim()
    : "";
  const fail = (
    summary: string,
    error: string,
    status: "blocked" | "failed" = "blocked",
  ): EnvironmentActionControlGatewayExecution => ({
    ok: false,
    status,
    summary,
    observation: syntheticObservation({
      capabilityId: input.capabilityId,
      turnId: input.turnId,
      workflowRef: workflowRef || null,
      summary,
    }),
    repairAction: error === "action_request_not_found" ? "repair" : "ask_user",
    error,
  });
  if (!spec) return fail("The requested player workflow control is not registered.", "capability_unavailable");
  const account = input.accountContext;
  const profileId = account?.profile_id?.trim() ?? "";
  const roomId = roomIdFromThread(input.conversationThreadId);
  if (
    !account?.trusted_account_session ||
    !account.account_session ||
    account.account_session.status !== "active" ||
    account.account_session.profile.profile_id !== profileId ||
    !roomId ||
    !workflowRef ||
    !input.turnId.trim()
  ) {
    return fail(
      "Minecraft player workflow controls require an exact signed-in room turn and workflow_ref.",
      "action_policy_denied",
    );
  }
  try {
    const participantId = await selectedParticipantId({
      deps,
      roomId,
      profileId,
      account,
    });
    if (!participantId) {
      return fail(
        "The current text author or GPT Live speaker could not be resolved to an active room participant.",
        "subject_binding_required",
      );
    }
    const context = await deps.resolveContext({
      roomId,
      profileId,
      workflowId: workflowRef,
      requestingParticipantId: participantId,
    });
    const reason = typeof input.arguments?.reason === "string"
      ? input.arguments.reason.trim()
      : `${spec.label} requested by the current room turn.`;
    const control = spec.controlKind === "emergency_stop"
      ? (await deps.emergencyStop({
          roomId,
          profileId,
          environmentBindingId: context.environmentBindingId,
          actionAuthorityId: context.actionAuthorityId,
          reason,
        })).controlRequest
      : await deps.requestControl({
          roomId,
          profileId,
          environmentBindingId: context.environmentBindingId,
          actionAuthorityId: context.actionAuthorityId,
          workflowId: context.workflowId,
          controlKind: spec.controlKind,
          reason,
        });
    const observation = await deps.awaitObservation({
      controlRequestId: control.control_request_id,
      deadlineAt: control.deadline_at,
    });
    const ok =
      observation.outcome === "completed" &&
      observation.provenance_valid &&
      observation.eligible_for_current_turn_reentry;
    return {
      ok,
      status: ok ? "completed" : "failed",
      summary: observation.summary,
      observation,
      executedArgs: {
        workflow_ref: workflowRef,
        control_kind: spec.controlKind,
      },
      ...(!ok
        ? {
            error: observation.outcome,
            repairAction: environmentActionControlFailureRepairAction(
              observation.outcome,
            ),
          }
        : {}),
    };
  } catch (error) {
    const code = isEnvironmentActionBrokerError(error)
      ? error.code
      : error instanceof Error && "code" in error
        ? String((error as { code?: unknown }).code ?? "action_control_invalid")
        : "action_control_invalid";
    return fail(
      error instanceof Error
        ? error.message
        : "The player workflow control failed before trustworthy observation re-entry.",
      code,
      "failed",
    );
  }
};
