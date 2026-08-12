import crypto from "node:crypto";
import {
  HELIX_ENVIRONMENT_ACTION_OBSERVATION_SCHEMA,
  helixEnvironmentActionRequestSchema,
  type HelixEnvironmentActionObservation,
} from "@shared/helix-environment-action";
import { HELIX_MINECRAFT_FABRIC_PLAYER_ACTION_PROFILE_ID } from "@shared/helix-environment-action-adapter-profile";
import {
  listEnvironmentConnectorCapabilityDescriptors,
} from "../../environment-connectors/catalog";
import { validateEnvironmentConnectorSchemaValue } from "../../environment-connectors/conformance";
import {
  awaitEnvironmentActionObservation,
  enqueueEnvironmentAction,
  isEnvironmentActionBrokerError,
  resolveEnvironmentActionExecutionContext,
  type EnvironmentActionExecutionContext,
} from "../../environment-connectors/actions";
import { requestEnvironmentActionWorkflowControl } from "../../environment-connectors/actions/authority-store";
import {
  isRoomEnvironmentSubjectError,
  listRoomEnvironmentProjections,
  resolveActiveRoomEnvironmentSubjectByRef,
} from "../../environment-connectors/subjects";
import { readSharedRealtimeRoomMembership } from "../realtime-room/room-store";
import type { HelixWorkstationGatewayAccountContext } from "./account-policy";
import type { HelixWorkstationCapabilityManifest } from "./types";

export const HELIX_ENVIRONMENT_ACTION_GATEWAY_ACTION =
  "room.environment.player_action" as const;

const actionDescriptors = listEnvironmentConnectorCapabilityDescriptors({
  adapterProfileId: HELIX_MINECRAFT_FABRIC_PLAYER_ACTION_PROFILE_ID,
});

const modelInputSchema = (
  descriptor: (typeof actionDescriptors)[number],
): Record<string, unknown> => {
  const source = structuredClone(descriptor.input_schema) as {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties: boolean;
  };
  delete source.properties.action_kind;
  source.required = (source.required ?? []).filter((key) => key !== "action_kind");
  source.properties.environment_label = {
    type: "string",
    minLength: 1,
    maxLength: 240,
    description:
      "Optional exact display label when this room has more than one player-action-enabled Minecraft environment.",
  };
  return source;
};

export const environmentActionMinecraftManifests: HelixWorkstationCapabilityManifest[] =
  actionDescriptors.map((descriptor) => ({
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: descriptor.capability_id,
    label: descriptor.trusted_model_label,
    description:
      `Player Embodiment plane: ${descriptor.trusted_model_description} Use this plane when the user asks the paired client to play through normal player controls or requires manual-input override semantics. A World Authority server command, including teleport, is not an equivalent substitute unless the user explicitly authorizes changing execution planes. Helix resolves the exact room, active speaker/player binding, authority, world, live client manifest, and catalog snapshot server-side. The connector releases controls on manual input, disconnect, cancellation, or emergency stop. A request_canceled observation with manual_override_detected is a non-retryable human-intervention boundary for the current turn: preserve its exact typed reason and ask the user to clear that state instead of issuing another player action automatically. This tool returns evidence for Codex re-entry; it is never the final answer.`,
    panel_id: null,
    action_id: HELIX_ENVIRONMENT_ACTION_GATEWAY_ACTION,
    mode: "act",
    mutating: true,
    code_mutation: false,
    shell_access: false,
    requires_confirmation: false,
    requires_source: true,
    terminal_eligible: false,
    permission_profile_required: "act",
    post_tool_model_step_required: true,
    input_schema: modelInputSchema(descriptor),
    output_observation_schema: HELIX_ENVIRONMENT_ACTION_OBSERVATION_SCHEMA,
    observation_schema: HELIX_ENVIRONMENT_ACTION_OBSERVATION_SCHEMA,
    safety_tags: [
      "separate_player_action_pairing",
      "exact_room_player_world_authority",
      "fresh_manifest_and_heartbeat_required",
      "manual_override_required",
      "manual_override_non_retryable_same_turn",
      "postcondition_verification_required",
      "emergency_stop_required",
      "one_shot_no_automatic_replay",
      "host_access_forbidden",
      "current_turn_evidence_reentry_required",
      "no_shell",
      "no_code_mutation",
      "non_terminal",
    ],
    assistant_answer: false,
    raw_content_included: false,
  }));

export type EnvironmentActionGatewayExecution = {
  ok: boolean;
  status: "completed" | "blocked" | "failed";
  summary: string;
  observation: HelixEnvironmentActionObservation;
  executedArgs?: Record<string, unknown>;
  idempotentReplay?: boolean;
  repairAction?: "repair" | "retry" | "ask_user";
  error?: string;
};

export type EnvironmentActionGatewayDependencies = {
  listRoomEnvironments: typeof listRoomEnvironmentProjections;
  readMembership: typeof readSharedRealtimeRoomMembership;
  resolveContext: typeof resolveEnvironmentActionExecutionContext;
  enqueueAction: typeof enqueueEnvironmentAction;
  awaitObservation: typeof awaitEnvironmentActionObservation;
  requestControl: typeof requestEnvironmentActionWorkflowControl;
  resolveTargetSubject: typeof resolveActiveRoomEnvironmentSubjectByRef;
};

const dependencies = (
  overrides: Partial<EnvironmentActionGatewayDependencies> = {},
): EnvironmentActionGatewayDependencies => ({
  listRoomEnvironments:
    overrides.listRoomEnvironments ?? listRoomEnvironmentProjections,
  readMembership: overrides.readMembership ?? readSharedRealtimeRoomMembership,
  resolveContext:
    overrides.resolveContext ?? resolveEnvironmentActionExecutionContext,
  enqueueAction: overrides.enqueueAction ?? enqueueEnvironmentAction,
  awaitObservation:
    overrides.awaitObservation ?? awaitEnvironmentActionObservation,
  requestControl:
    overrides.requestControl ?? requestEnvironmentActionWorkflowControl,
  resolveTargetSubject:
    overrides.resolveTargetSubject ?? resolveActiveRoomEnvironmentSubjectByRef,
});

const roomIdFromThread = (threadId: string | null | undefined): string | null => {
  const prefix = "helix-ask:room:";
  const normalized = threadId?.trim() ?? "";
  return normalized.startsWith(prefix)
    ? normalized.slice(prefix.length).trim() || null
    : null;
};

const descriptorFor = (capabilityId: string) =>
  actionDescriptors.find((entry) => entry.capability_id === capabilityId) ?? null;

const syntheticFailure = (input: {
  turnId: string;
  capabilityId: string;
  actionKind: string;
  outcome: HelixEnvironmentActionObservation["outcome"];
  summary: string;
}): HelixEnvironmentActionObservation => {
  const hash = crypto
    .createHash("sha256")
    .update(
      `${input.turnId}\n${input.capabilityId}\n${input.actionKind}\n${input.outcome}`,
      "utf8",
    )
    .digest("hex");
  return {
    schema: HELIX_ENVIRONMENT_ACTION_OBSERVATION_SCHEMA,
    action_request_ref: `environment_action_request_uncreated:${hash.slice(0, 40)}`,
    workflow_ref: `environment_action_workflow_uncreated:${hash.slice(0, 40)}`,
    action_execution_ref: null,
    capability_id: input.capabilityId,
    capability_version: 1,
    action_kind: input.actionKind || "unknown_action",
    outcome: input.outcome,
    summary: input.summary,
    result: {},
    progress_observation_refs: [],
    postcondition_evidence_refs: [],
    evidence_ref: `environment_action_failure:${hash.slice(0, 40)}`,
    observed_at: new Date().toISOString(),
    provenance_valid: false,
    eligible_for_current_turn_reentry: false,
    content_role: "environment_action_observation_not_assistant_answer",
    reentry_required: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

export const environmentActionFailureRepairAction = (
  outcome: HelixEnvironmentActionObservation["outcome"],
): "repair" | "retry" | "ask_user" => {
  if (
    [
      "precondition_failed",
      "postcondition_failed",
      "capability_version_changed",
      "control_engine_unavailable",
    ].includes(outcome)
  ) return "repair";
  if (
    [
      "connector_offline",
      "workflow_timeout",
      "action_outcome_unknown",
    ].includes(outcome)
  ) return "retry";
  return "ask_user";
};

export const environmentActionGatewayAdmissionStatus = (
  status: EnvironmentActionGatewayExecution["status"],
): "admitted" | "blocked" => status === "blocked" ? "blocked" : "admitted";

const failed = (input: {
  turnId: string;
  capabilityId: string;
  actionKind: string;
  outcome: HelixEnvironmentActionObservation["outcome"];
  summary: string;
  status?: "blocked" | "failed";
}): EnvironmentActionGatewayExecution => ({
  ok: false,
  status: input.status ?? "blocked",
  summary: input.summary,
  observation: syntheticFailure(input),
  repairAction: environmentActionFailureRepairAction(input.outcome),
  error: input.outcome,
});

const selectedParticipantId = async (input: {
  deps: EnvironmentActionGatewayDependencies;
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

const normalizeActionArguments = (
  actionKind: string,
  args: Record<string, unknown>,
): Record<string, unknown> => {
  const clean = Object.fromEntries(
    Object.entries(args).filter(([key]) => key !== "environment_label"),
  );
  if (actionKind === "look_at") {
    const targetKind = typeof clean.target_kind === "string"
      ? clean.target_kind
      : "";
    const target = targetKind === "position"
      ? { target_kind: "position", position: clean.position }
      : targetKind === "relative_rotation"
        ? {
            target_kind: "relative_rotation",
            // The model-facing schema deliberately permits a single-axis
            // rotation. Materialize the unchanged axis as zero before the
            // stricter connector protocol is parsed so a yaw-only request
            // never becomes a needless user-input interruption.
            yaw_delta_degrees: clean.yaw_delta_degrees ?? 0,
            pitch_delta_degrees: clean.pitch_delta_degrees ?? 0,
          }
        : { target_kind: "current_focus" };
    delete clean.target_kind;
    delete clean.position;
    delete clean.yaw_delta_degrees;
    delete clean.pitch_delta_degrees;
    return { ...clean, action_kind: actionKind, target };
  }
  return { ...clean, action_kind: actionKind };
};

const postconditionFor = (
  actionKind: string,
  args: Record<string, unknown>,
): { condition_id: string; condition_kind: string; required: true; parameters: Record<string, unknown> } => {
  const conditionKind = {
    navigate_to: "minecraft.player.position_within_radius",
    look_at: "minecraft.player.view_targeted",
    walk: "minecraft.player.motion_completed",
    jump: "minecraft.player.jump_sequence_completed",
    interact: "minecraft.player.interaction_accepted",
    hotbar_select: "minecraft.player.hotbar_slot_selected",
    equip: "minecraft.player.equipment_slot_matches",
    follow: "minecraft.player.follow_interval_completed",
    collect: "minecraft.player.inventory_increased_by_requested_count",
    mine: "minecraft.world.matching_blocks_removed",
    place: "minecraft.world.exact_positions_match_block",
    craft: "minecraft.player.crafted_output_increased_by_requested_count",
    inventory_transfer: "minecraft.player.container_transfer_delta_matches",
  }[actionKind] ?? "minecraft.player.action_completed";
  return {
    condition_id: `environment_action_condition:${crypto.randomUUID()}`,
    condition_kind: conditionKind,
    required: true,
    parameters: args,
  };
};

const contextErrorOutcome = (
  error: unknown,
): HelixEnvironmentActionObservation["outcome"] => {
  if (!isEnvironmentActionBrokerError(error)) return "failed";
  switch (error.code) {
    case "action_authority_not_found":
      return "subject_binding_required";
    case "action_authority_inactive":
    case "action_policy_denied":
      return "permission_revoked";
    case "action_connector_stale":
    case "action_manifest_required":
      return "connector_offline";
    case "action_request_expired":
      return "action_outcome_unknown";
    default:
      return "failed";
  }
};

const publicPostconditionArguments = (
  args: Record<string, unknown>,
): Record<string, unknown> => Object.fromEntries(
  Object.entries(args).filter(([key]) =>
    key !== "target_subject_native_id" && key !== "target_subject_label"),
);

const positiveIntegerArgument = (
  args: Record<string, unknown>,
  key: string,
): number => {
  const value = args[key];
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : 0;
};

export const executeEnvironmentActionGatewayCapability = async (input: {
  capabilityId: string;
  turnId: string;
  toolCallId?: string | null;
  providerExecutionId?: string | null;
  arguments?: Record<string, unknown>;
  accountContext?: HelixWorkstationGatewayAccountContext | null;
  conversationThreadId?: string | null;
  signal?: AbortSignal;
  dependencies?: Partial<EnvironmentActionGatewayDependencies>;
}): Promise<EnvironmentActionGatewayExecution> => {
  const deps = dependencies(input.dependencies);
  const descriptor = descriptorFor(input.capabilityId);
  const actionKind = String(
    descriptor?.input_schema.properties?.action_kind &&
      "enum" in descriptor.input_schema.properties.action_kind
      ? descriptor.input_schema.properties.action_kind.enum?.[0] ?? "unknown_action"
      : "unknown_action",
  );
  if (!descriptor) {
    return failed({
      turnId: input.turnId,
      capabilityId: input.capabilityId,
      actionKind,
      outcome: "capability_unavailable",
      summary: "The requested Minecraft player capability is not registered.",
    });
  }
  const args = input.arguments ?? {};
  const account = input.accountContext;
  const profileId = account?.profile_id?.trim() ?? "";
  const roomId = roomIdFromThread(input.conversationThreadId);
  const toolCallId = input.toolCallId?.trim() ?? "";
  const providerExecutionId = input.providerExecutionId?.trim() ?? "";
  if (
    !account?.trusted_account_session ||
    !account.account_session ||
    account.account_session.status !== "active" ||
    account.account_session.profile.profile_id !== profileId ||
    !roomId ||
    !toolCallId ||
    !providerExecutionId ||
    !input.turnId.trim()
  ) {
    return failed({
      turnId: input.turnId,
      capabilityId: input.capabilityId,
      actionKind,
      outcome: "permission_revoked",
      summary:
        "Minecraft player actions require an exact signed-in room turn and provider tool-call identity.",
    });
  }
  const argumentIssues = validateEnvironmentConnectorSchemaValue(
    modelInputSchema(descriptor),
    args,
  );
  if (argumentIssues.length > 0) {
    const issueSummary = argumentIssues
      .slice(0, 4)
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join("; ");
    return failed({
      turnId: input.turnId,
      capabilityId: input.capabilityId,
      actionKind,
      outcome: "precondition_failed",
      summary:
        `Minecraft player-action arguments did not satisfy the admitted input schema${issueSummary ? `: ${issueSummary}` : "."}`,
    });
  }
  let actionAdmissionReached = false;
  try {
    const participantId = await selectedParticipantId({
      deps,
      roomId,
      profileId,
      account,
    });
    if (!participantId) {
      return failed({
        turnId: input.turnId,
        capabilityId: input.capabilityId,
        actionKind,
        outcome: "subject_binding_required",
        summary:
          "The current text author or GPT Live speaker could not be resolved to an active room participant.",
      });
    }
    const requestedLabel = typeof args.environment_label === "string"
      ? args.environment_label.trim().toLowerCase()
      : "";
    const environments = (await deps.listRoomEnvironments({ roomId, profileId }))
      .filter((environment) =>
        environment.domain === "minecraft" &&
        environment.connection_status === "active" &&
        (!requestedLabel ||
          environment.source_label.trim().toLowerCase() === requestedLabel),
      );
    if (environments.length !== 1) {
      return failed({
        turnId: input.turnId,
        capabilityId: input.capabilityId,
        actionKind,
        outcome: environments.length === 0 ? "wrong_environment" : "wrong_environment",
        summary: environments.length === 0
          ? "No active Minecraft environment matches this room action request."
          : "More than one active Minecraft environment matches; select its exact visible label.",
      });
    }
    const context = await deps.resolveContext({
      roomId,
      profileId,
      environmentBindingId: environments[0].environment_binding_id,
      participantId,
      capabilityId: input.capabilityId,
    });
    if (context.autonomyMode === "approve_each") {
      return failed({
        turnId: input.turnId,
        capabilityId: input.capabilityId,
        actionKind,
        outcome: "permission_revoked",
        summary:
          "This player authority requires a current per-action approval. Approve the action in the room or change its authority mode.",
      });
    }
    let actionArguments = normalizeActionArguments(
      context.capability.actionKind,
      args,
    );
    if (context.capability.actionKind === "follow") {
      const subjectRef = typeof actionArguments.subject_ref === "string"
        ? actionArguments.subject_ref.trim()
        : "";
      const target = await deps.resolveTargetSubject({
        roomId,
        profileId,
        environmentBindingId: context.environmentBindingId,
        sourceId: context.sourceId,
        worldId: context.worldId,
        subjectRef,
      });
      if (target.subjectNativeId === context.subjectNativeId) {
        return failed({
          turnId: input.turnId,
          capabilityId: input.capabilityId,
          actionKind,
          outcome: "precondition_failed",
          summary: "The paired player cannot follow its own environment identity.",
        });
      }
      actionArguments = {
        ...actionArguments,
        target_subject_native_id: target.subjectNativeId,
        target_subject_label: target.subjectLabel,
      };
    }
    const now = new Date();
    const actionDurationMs = context.capability.actionKind === "follow"
      ? positiveIntegerArgument(actionArguments, "max_duration_ms")
      : 0;
    const durationCeilingMs = Math.min(
      descriptor.timeout_ceiling_ms,
      30 * 60_000,
    );
    const maxDurationMs = actionDurationMs > 0
      ? Math.min(actionDurationMs + 5_000, durationCeilingMs)
      : durationCeilingMs;
    const deadlineAt = new Date(
      now.getTime() + maxDurationMs,
    ).toISOString();
    const requestedEngine =
      typeof actionArguments.engine_preference === "string"
        ? actionArguments.engine_preference
        : "native_fabric";
    const workflowMode = context.capability.workflowModes.includes("long_running")
      ? "long_running"
      : "single_action";
    const request = helixEnvironmentActionRequestSchema.parse({
      schema: "helix.environment_action.request.v1",
      action_request_id: `environment_action_request:${crypto.randomUUID()}`,
      workflow_id: `environment_action_workflow:${crypto.randomUUID()}`,
      action_authority_id: context.actionAuthorityId,
      environment_binding_id: context.environmentBindingId,
      room_id: context.roomId,
      source_id: context.sourceId,
      world_id: context.worldId,
      participant_id: context.participantId,
      subject_binding_id: context.subjectBindingId,
      subject_native_id: context.subjectNativeId,
      run_id: `first_party_shared_room:${crypto
        .createHash("sha256")
        .update(`${profileId}\n${roomId}\n${participantId}`)
        .digest("hex")
        .slice(0, 40)}`,
      turn_id: input.turnId,
      provider_execution_id: providerExecutionId,
      tool_call_id: toolCallId,
      catalog_snapshot_id: context.catalogSnapshotId,
      capability_id: context.capability.capabilityId,
      capability_version: context.capability.capabilityVersion,
      action_kind: context.capability.actionKind,
      effect_class: context.capability.effectClass,
      workflow_mode: workflowMode,
      requested_control_engine: requestedEngine,
      arguments: actionArguments,
      preconditions: [
        {
          condition_id: `environment_action_condition:${crypto.randomUUID()}`,
          condition_kind: "minecraft.player.connected_and_bound",
          required: true,
          parameters: {},
        },
      ],
      postconditions: [postconditionFor(
        context.capability.actionKind,
        publicPostconditionArguments(actionArguments),
      )],
      idempotency_key: `room-player-action:${crypto
        .createHash("sha256")
        .update(`${input.turnId}\n${input.capabilityId}\n${JSON.stringify(actionArguments)}`)
        .digest("hex")}`,
      confirmation_state: "not_required",
      approval_ref: null,
      created_at: now.toISOString(),
      deadline_at: deadlineAt,
      constraints: {
        max_duration_ms: maxDurationMs,
        max_distance_blocks: 30_000_000,
        max_block_mutations:
          context.capability.actionKind === "mine"
            ? positiveIntegerArgument(actionArguments, "count")
            : context.capability.actionKind === "place" &&
                Array.isArray(actionArguments.positions)
              ? actionArguments.positions.length
              : 0,
        max_inventory_transfers: [
          "collect",
          "mine",
          "place",
          "craft",
          "inventory_transfer",
        ].includes(context.capability.actionKind)
          ? Math.min(
              10_000,
              (positiveIntegerArgument(actionArguments, "count") ||
                (Array.isArray(actionArguments.positions)
                  ? actionArguments.positions.length
                  : 0)) +
                (["collect", "craft"].includes(context.capability.actionKind)
                  ? 63
                  : 0),
            )
          : context.capability.actionKind === "equip" ? 1 : 0,
        manual_override_policy: context.manualOverridePolicy,
        require_postcondition_verification: true,
        world_mutation_allowed:
          context.capability.effectClass === "world_mutation",
        combat_allowed: false,
        host_access_allowed: false,
        automatic_replay_allowed: false,
      },
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    actionAdmissionReached = true;
    const queued = await deps.enqueueAction({
      profileId,
      requestingParticipantId: participantId,
      request,
    });
    let abortCancellation: Promise<unknown> | null = null;
    const cancelOnAbort = (): void => {
      if (abortCancellation) return;
      abortCancellation = deps.requestControl({
        roomId,
        profileId,
        environmentBindingId: context.environmentBindingId,
        actionAuthorityId: context.actionAuthorityId,
        workflowId: queued.workflow_id,
        controlKind: "cancel",
        reason:
          "The owning Helix Ask turn ended before the player-action observation returned.",
      }).catch(() => null);
    };
    input.signal?.addEventListener("abort", cancelOnAbort, { once: true });
    if (input.signal?.aborted) cancelOnAbort();
    let observation: HelixEnvironmentActionObservation;
    try {
      observation = await deps.awaitObservation({
        requestId: queued.action_request_id,
        deadlineAt: queued.deadline_at,
        signal: input.signal,
      });
    } catch (error) {
      if (abortCancellation) await abortCancellation;
      throw error;
    } finally {
      input.signal?.removeEventListener("abort", cancelOnAbort);
    }
    const idempotentReplay = queued.tool_call_id !== toolCallId;
    const ok =
      observation.outcome === "succeeded" &&
      observation.provenance_valid &&
      observation.eligible_for_current_turn_reentry;
    return {
      ok,
      status: ok ? "completed" : "failed",
      summary: idempotentReplay
        ? `Helix did not execute the duplicate player action again; it re-entered the existing observation. ${observation.summary}`
        : observation.summary,
      observation,
      idempotentReplay,
      ...(ok
        ? {
            executedArgs: {
              ...Object.fromEntries(
                Object.entries(args).filter(([key]) => key !== "environment_label"),
              ),
              idempotent_replay: idempotentReplay,
              physical_execution_performed: !idempotentReplay,
            },
          }
        : {
            error: observation.outcome,
            repairAction: environmentActionFailureRepairAction(
              observation.outcome,
            ),
          }),
    };
  } catch (error) {
    const outcome = isRoomEnvironmentSubjectError(error)
      ? error.code === "wrong_environment" || error.code === "wrong_world"
        ? "wrong_environment"
        : error.code === "subject_offline" || error.code === "subject_binding_stale"
          ? "precondition_failed"
          : "subject_binding_required"
      : contextErrorOutcome(error);
    return failed({
      turnId: input.turnId,
      capabilityId: input.capabilityId,
      actionKind,
      outcome,
      summary:
        error instanceof Error
          ? error.message
          : "The Minecraft player-action lane failed before trustworthy observation re-entry.",
      status: actionAdmissionReached ? "failed" : "blocked",
    });
  }
};
