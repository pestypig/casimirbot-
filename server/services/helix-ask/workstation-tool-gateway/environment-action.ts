import crypto from "node:crypto";
import {
  HELIX_ENVIRONMENT_ACTION_OBSERVATION_SCHEMA,
  HELIX_ENVIRONMENT_ACTION_RESULT_DELIVERY_GRACE_MS,
  helixEnvironmentActionRequestSchema,
  type HelixEnvironmentActionObservation,
} from "@shared/helix-environment-action";
import { HELIX_MINECRAFT_FABRIC_PLAYER_ACTION_PROFILE_ID } from "@shared/helix-environment-action-adapter-profile";
import type { HelixEnvironmentConstrainedJsonSchema } from "@shared/helix-environment-connector";
import {
  helixMinecraftFluidSequenceArgumentsSchema,
  type HelixMinecraftFluidSequenceArguments,
} from "@shared/helix-minecraft-fluid-sequence";
import { helixMinecraftReactiveProgramArgumentsSchema } from "@shared/helix-minecraft-reactive-program";
import { helixMinecraftPlayerActionArgumentsSchema } from "@shared/helix-minecraft-player-capabilities";
import {
  helixMinecraftArmViabilityGuardianArgumentsSchema,
  helixMinecraftDisarmViabilityGuardianArgumentsSchema,
} from "@shared/helix-minecraft-viability-guardian";
import type { ZodIssue } from "zod";
import { listEnvironmentConnectorCapabilityDescriptors } from "../../environment-connectors/catalog";
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
): HelixEnvironmentConstrainedJsonSchema => {
  const source = structuredClone(descriptor.input_schema) as {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties: boolean;
  };
  delete source.properties.action_kind;
  source.required = (source.required ?? []).filter(
    (key) => key !== "action_kind",
  );
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
    description: `Player Embodiment plane: ${descriptor.trusted_model_description} Use this plane when the user asks the paired client to play through normal player controls or requires manual-input override semantics. A World Authority server command, including teleport, is not an equivalent substitute unless the user explicitly authorizes changing execution planes. Helix resolves the exact room, active speaker/player binding, authority, world, live client manifest, and catalog snapshot server-side. The connector releases controls on manual input, disconnect, cancellation, or emergency stop. A request_canceled observation with manual_override_detected is a non-retryable human-intervention boundary for the current turn: preserve its exact typed reason and ask the user to clear that state instead of issuing another player action automatically. connector_offline and action_outcome_unknown are also non-retryable in the same turn because recovery requires external connector state or the prior mutation cannot safely be replayed. This tool returns evidence for Codex re-entry; it is never the final answer.`,
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
      "connector_recovery_non_retryable_same_turn",
      "unknown_mutation_no_automatic_replay",
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

const roomIdFromThread = (
  threadId: string | null | undefined,
): string | null => {
  const prefix = "helix-ask:room:";
  const normalized = threadId?.trim() ?? "";
  return normalized.startsWith(prefix)
    ? normalized.slice(prefix.length).trim() || null
    : null;
};

const descriptorFor = (capabilityId: string) =>
  actionDescriptors.find((entry) => entry.capability_id === capabilityId) ??
  null;

const boundedRepairDiagnostic = (
  issues: readonly { path: string | readonly (string | number)[]; message: string }[],
  fallbackPath: string,
): string =>
  issues
    .slice(0, 12)
    .map((issue) => {
      const path = Array.isArray(issue.path)
        ? issue.path.join(".") || fallbackPath
        : issue.path || fallbackPath;
      return `${path}: ${issue.message}`;
    })
    .join("; ");

const trustedContractRepairDiagnostic = (
  issues: readonly ZodIssue[],
  fallbackPath: string,
): string => boundedRepairDiagnostic(issues, fallbackPath);

const syntheticFailure = (input: {
  turnId: string;
  capabilityId: string;
  actionKind: string;
  outcome: HelixEnvironmentActionObservation["outcome"];
  summary: string;
  actionRequestRef?: string;
  workflowRef?: string;
  repairDiagnosticEligibleForCurrentTurnReentry?: boolean;
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
    action_request_ref:
      input.actionRequestRef ??
      `environment_action_request_uncreated:${hash.slice(0, 40)}`,
    workflow_ref:
      input.workflowRef ??
      `environment_action_workflow_uncreated:${hash.slice(0, 40)}`,
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
    // A trusted, non-executed contract rejection may re-enter the same model
    // turn as repair guidance without becoming evidence that Minecraft state
    // changed. World-success authority still requires provenance_valid=true.
    eligible_for_current_turn_reentry:
      input.repairDiagnosticEligibleForCurrentTurnReentry === true,
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
  summary?: string,
): "repair" | "retry" | "ask_user" => {
  if (["connector_offline", "action_outcome_unknown"].includes(outcome))
    return "ask_user";
  if (
    outcome === "request_canceled" &&
    /(?:requires?|request(?:ed|ing)?)_semantic_replan|semantic replan/i.test(
      summary ?? "",
    )
  )
    return "repair";
  if (
    [
      "failed",
      "precondition_failed",
      "postcondition_failed",
      "capability_version_changed",
      "control_engine_unavailable",
    ].includes(outcome)
  )
    return "repair";
  if (
    [
      "workflow_timeout",
    ].includes(outcome)
  )
    return "retry";
  return "ask_user";
};

export const environmentActionGatewayAdmissionStatus = (
  status: EnvironmentActionGatewayExecution["status"],
): "admitted" | "blocked" => (status === "blocked" ? "blocked" : "admitted");

const failed = (input: {
  turnId: string;
  capabilityId: string;
  actionKind: string;
  outcome: HelixEnvironmentActionObservation["outcome"];
  summary: string;
  status?: "blocked" | "failed";
  actionRequestRef?: string;
  workflowRef?: string;
  repairDiagnosticEligibleForCurrentTurnReentry?: boolean;
}): EnvironmentActionGatewayExecution => ({
  ok: false,
  status: input.status ?? "blocked",
  summary: input.summary,
  observation: syntheticFailure(input),
  repairAction: environmentActionFailureRepairAction(
    input.outcome,
    input.summary,
  ),
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
    !["realtime_voice", "environment_interaction"].includes(actor.origin) ||
    actor.room_id !== input.roomId ||
    actor.requester_profile_id !== input.profileId ||
    actor.resolution !== "resolved" ||
    !actor.participant_id
  )
    return null;
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
    const targetKind =
      typeof clean.target_kind === "string" ? clean.target_kind : "";
    const target =
      targetKind === "position"
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
  if (actionKind === "track_target") {
    const targetKind =
      clean.target_kind === "entity_type"
        ? "entity_type"
        : clean.target_kind === "particle_type"
          ? "particle_type"
          : "current_focus_entity";
    const particleContinuity =
      clean.continuity === "same_type_stream"
        ? "same_type_stream"
        : "single_instance";
    const target =
      targetKind === "entity_type"
        ? {
            target_kind: "entity_type",
            entity_type_id: clean.entity_type_id,
            selection: "nearest",
          }
        : targetKind === "particle_type"
          ? {
              target_kind: "particle_type",
              particle_type_id: clean.particle_type_id,
              selection: "nearest",
              continuity: particleContinuity,
              handoff_radius:
                particleContinuity === "single_instance"
                  ? (clean.handoff_radius ?? 0)
                  : clean.handoff_radius,
              max_handoffs:
                particleContinuity === "single_instance"
                  ? (clean.max_handoffs ?? 0)
                  : clean.max_handoffs,
            }
          : { target_kind: "current_focus_entity" };
    delete clean.target_kind;
    delete clean.entity_type_id;
    delete clean.particle_type_id;
    delete clean.continuity;
    delete clean.handoff_radius;
    delete clean.max_handoffs;
    return { ...clean, action_kind: actionKind, target };
  }
  return { ...clean, action_kind: actionKind };
};

const postconditionFor = (
  actionKind: string,
  args: Record<string, unknown>,
): {
  condition_id: string;
  condition_kind: string;
  required: true;
  parameters: Record<string, unknown>;
} => {
  const conditionKind =
    {
      navigate_to: "minecraft.player.position_within_radius",
      look_at: "minecraft.player.view_targeted",
      track_target: "minecraft.player.camera_tracking_completed",
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
      consume: "minecraft.player.consumable_postconditions_satisfied",
      inventory_transfer: "minecraft.player.container_transfer_delta_matches",
      execute_sequence: "minecraft.player.sequence_checkpoints_satisfied",
      execute_reactive_program: "minecraft.player.reactive_program_completed",
      arm_viability_guardian: "minecraft.player.viability_guardian_armed",
      disarm_viability_guardian: "minecraft.player.viability_guardian_disarmed",
    }[actionKind] ?? "minecraft.player.action_completed";
  const parameters =
    actionKind === "execute_sequence"
      ? {
          sequence_id: args.sequence_id,
          ruleset: args.ruleset,
          max_total_ticks: args.max_total_ticks,
          required_checkpoint_ids: args.required_checkpoint_ids,
        }
      : actionKind === "execute_reactive_program"
        ? {
            program_id: args.program_id,
            ruleset: args.ruleset,
            max_total_ticks: args.max_total_ticks,
            completion_policy: args.completion_policy,
          }
        : actionKind === "arm_viability_guardian"
          ? {
              profile_id: args.profile_id,
              duration_ticks: args.duration_ticks,
              response_repertoire: args.response_repertoire,
            }
          : actionKind === "disarm_viability_guardian"
            ? { profile_id: args.profile_id }
        : args;
  return {
    condition_id: `environment_action_condition:${crypto.randomUUID()}`,
    condition_kind: conditionKind,
    required: true,
    parameters,
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
    case "action_request_conflict":
      return "duplicate_request";
    default:
      return "failed";
  }
};

const publicPostconditionArguments = (
  args: Record<string, unknown>,
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(args).filter(
      ([key]) =>
        key !== "target_subject_native_id" && key !== "target_subject_label",
    ),
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

const playerProgramMutationScope = (
  args: Record<string, unknown>,
): HelixMinecraftFluidSequenceArguments["mutation_scope"] | null => {
  if (args.action_kind === "execute_sequence") {
    const parsed = helixMinecraftFluidSequenceArgumentsSchema.safeParse(args);
    return parsed.success ? parsed.data.mutation_scope : null;
  }
  if (args.action_kind === "execute_reactive_program") {
    const parsed = helixMinecraftReactiveProgramArgumentsSchema.safeParse(args);
    return parsed.success ? parsed.data.mutation_scope : null;
  }
  return null;
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
      ? (descriptor.input_schema.properties.action_kind.enum?.[0] ??
          "unknown_action")
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
    const issueSummary = boundedRepairDiagnostic(argumentIssues, "arguments");
    return failed({
      turnId: input.turnId,
      capabilityId: input.capabilityId,
      actionKind,
      outcome: "precondition_failed",
      summary: `Minecraft player-action arguments did not satisfy the admitted input schema${issueSummary ? `: ${issueSummary}` : "."}`,
      repairDiagnosticEligibleForCurrentTurnReentry: true,
    });
  }
  let actionAdmissionReached = false;
  let admittedActionRefs: {
    actionRequestRef: string;
    workflowRef: string;
  } | null = null;
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
    const requestedLabel =
      typeof args.environment_label === "string"
        ? args.environment_label.trim().toLowerCase()
        : "";
    const activeMinecraftEnvironments = (
      await deps.listRoomEnvironments({ roomId, profileId })
    ).filter(
      (environment) =>
        environment.domain === "minecraft" &&
        environment.connection_status === "active",
    );
    const exactLabelMatches = requestedLabel
      ? activeMinecraftEnvironments.filter(
          (environment) =>
            environment.source_label.trim().toLowerCase() === requestedLabel,
        )
      : [];
    // A provider-authored display label is only a disambiguation hint. The
    // exact room, profile, environment binding, participant, subject, and
    // action authority are resolved below from trusted server state. Let a
    // natural phrase such as "minecraft" select the sole active room source,
    // but never use it to guess among multiple active Minecraft environments.
    const environments =
      exactLabelMatches.length > 0
        ? exactLabelMatches
        : activeMinecraftEnvironments;
    if (environments.length !== 1) {
      return failed({
        turnId: input.turnId,
        capabilityId: input.capabilityId,
        actionKind,
        outcome:
          environments.length === 0 ? "wrong_environment" : "wrong_environment",
        summary:
          environments.length === 0
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
    if (context.capability.actionKind === "execute_sequence") {
      const parsedSequence =
        helixMinecraftFluidSequenceArgumentsSchema.safeParse(actionArguments);
      if (!parsedSequence.success) {
        const issueSummary = trustedContractRepairDiagnostic(
          parsedSequence.error.issues,
          "sequence",
        );
        return failed({
          turnId: input.turnId,
          capabilityId: input.capabilityId,
          actionKind,
          outcome: "precondition_failed",
          summary: `The bounded Minecraft sequence failed its trusted contract${issueSummary ? `: ${issueSummary}` : "."}`,
          repairDiagnosticEligibleForCurrentTurnReentry: true,
        });
      }
      actionArguments = parsedSequence.data;
    }
    if (context.capability.actionKind === "execute_reactive_program") {
      const parsedProgram =
        helixMinecraftReactiveProgramArgumentsSchema.safeParse(actionArguments);
      if (!parsedProgram.success) {
        const issueSummary = trustedContractRepairDiagnostic(
          parsedProgram.error.issues,
          "program",
        );
        return failed({
          turnId: input.turnId,
          capabilityId: input.capabilityId,
          actionKind,
          outcome: "precondition_failed",
          summary: `The concurrent Minecraft guardian program failed its trusted contract${issueSummary ? `: ${issueSummary}` : "."}`,
          repairDiagnosticEligibleForCurrentTurnReentry: true,
        });
      }
      actionArguments = parsedProgram.data;
    }
    if (context.capability.actionKind === "arm_viability_guardian") {
      const parsedGuardian =
        helixMinecraftArmViabilityGuardianArgumentsSchema.safeParse(
          actionArguments,
        );
      if (!parsedGuardian.success) {
        const issueSummary = trustedContractRepairDiagnostic(
          parsedGuardian.error.issues,
          "resident guardian",
        );
        return failed({
          turnId: input.turnId,
          capabilityId: input.capabilityId,
          actionKind,
          outcome: "precondition_failed",
          summary: `The resident Minecraft guardian failed its trusted bounded profile contract${issueSummary ? `: ${issueSummary}` : "."}`,
          repairDiagnosticEligibleForCurrentTurnReentry: true,
        });
      }
      actionArguments = parsedGuardian.data;
    }
    if (context.capability.actionKind === "disarm_viability_guardian") {
      const parsedDisarm =
        helixMinecraftDisarmViabilityGuardianArgumentsSchema.safeParse(
          actionArguments,
        );
      if (!parsedDisarm.success) {
        const issueSummary = trustedContractRepairDiagnostic(
          parsedDisarm.error.issues,
          "resident guardian disarm",
        );
        return failed({
          turnId: input.turnId,
          capabilityId: input.capabilityId,
          actionKind,
          outcome: "precondition_failed",
          summary: `The resident Minecraft guardian disarm failed its trusted profile contract${issueSummary ? `: ${issueSummary}` : "."}`,
          repairDiagnosticEligibleForCurrentTurnReentry: true,
        });
      }
      actionArguments = parsedDisarm.data;
    }
    if (context.capability.actionKind === "track_target") {
      const parsedAction =
        helixMinecraftPlayerActionArgumentsSchema.safeParse(actionArguments);
      if (!parsedAction.success) {
        const issueSummary = trustedContractRepairDiagnostic(
          parsedAction.error.issues,
          "tracker",
        );
        return failed({
          turnId: input.turnId,
          capabilityId: input.capabilityId,
          actionKind,
          outcome: "precondition_failed",
          summary: `The bounded Minecraft camera tracker failed its trusted contract${issueSummary ? `: ${issueSummary}` : "."}`,
          repairDiagnosticEligibleForCurrentTurnReentry: true,
        });
      }
      actionArguments = parsedAction.data;
    }
    if (context.capability.actionKind === "follow") {
      const subjectRef =
        typeof actionArguments.subject_ref === "string"
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
          summary:
            "The paired player cannot follow its own environment identity.",
        });
      }
      actionArguments = {
        ...actionArguments,
        target_subject_native_id: target.subjectNativeId,
        target_subject_label: target.subjectLabel,
      };
    }
    const now = new Date();
    const actionDurationMs =
      context.capability.actionKind === "follow" ||
      context.capability.actionKind === "track_target" ||
      context.capability.actionKind === "attack"
        ? positiveIntegerArgument(actionArguments, "max_duration_ms")
        : context.capability.actionKind === "execute_sequence" ||
            context.capability.actionKind === "execute_reactive_program"
          ? positiveIntegerArgument(actionArguments, "max_total_ticks") * 50
          : context.capability.actionKind === "arm_viability_guardian"
            ? 5_000
          : 0;
    const durationCeilingMs = Math.min(
      descriptor.timeout_ceiling_ms,
      30 * 60_000,
    );
    const executionDurationMs =
      actionDurationMs > 0
        ? Math.min(actionDurationMs, durationCeilingMs)
        : durationCeilingMs;
    const maxDurationMs =
      actionDurationMs > 0
        ? Math.min(
            actionDurationMs +
              HELIX_ENVIRONMENT_ACTION_RESULT_DELIVERY_GRACE_MS,
            durationCeilingMs,
          )
        : durationCeilingMs;
    const deadlineAt = new Date(now.getTime() + maxDurationMs).toISOString();
    const requestedEngine =
      context.capability.actionKind === "execute_sequence" ||
      context.capability.actionKind === "execute_reactive_program" ||
      context.capability.actionKind === "arm_viability_guardian"
      || context.capability.actionKind === "disarm_viability_guardian"
        ? "native_fabric"
        : typeof actionArguments.engine_preference === "string"
          ? actionArguments.engine_preference
          : "native_fabric";
    const workflowMode = context.capability.workflowModes.includes(
      "long_running",
    )
      ? "long_running"
      : "single_action";
    const programMutationScope = playerProgramMutationScope(actionArguments);
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
      postconditions: [
        postconditionFor(
          context.capability.actionKind,
          publicPostconditionArguments(actionArguments),
        ),
      ],
      idempotency_key: `room-player-action:${crypto
        .createHash("sha256")
        .update(
          `${input.turnId}\n${input.capabilityId}\n${JSON.stringify(actionArguments)}`,
        )
        .digest("hex")}`,
      confirmation_state: "not_required",
      approval_ref: null,
      created_at: now.toISOString(),
      deadline_at: deadlineAt,
      constraints: {
        // Keep the connector's execution ceiling separate from the outer
        // observation deadline so a terminal result has time to leave the
        // durable delivery outbox before Helix declares an unknown outcome.
        max_duration_ms: executionDurationMs,
        max_distance_blocks: 30_000_000,
        max_block_mutations: programMutationScope
          ? programMutationScope.max_block_mutations
          : context.capability.actionKind === "mine"
            ? positiveIntegerArgument(actionArguments, "count")
            : context.capability.actionKind === "place" &&
                Array.isArray(actionArguments.positions)
              ? actionArguments.positions.length
              : context.capability.actionKind === "place" &&
                  actionArguments.position_binding
                ? 1
                : 0,
        max_inventory_transfers: [
          "collect",
          "mine",
          "place",
          "craft",
          "consume",
          "inventory_transfer",
        ].includes(context.capability.actionKind)
          ? Math.min(
              10_000,
              (positiveIntegerArgument(actionArguments, "count") ||
                (Array.isArray(actionArguments.positions)
                  ? actionArguments.positions.length
                  : context.capability.actionKind === "place" &&
                      actionArguments.position_binding
                    ? 1
                    : 0)) +
                (["collect", "craft"].includes(context.capability.actionKind)
                  ? 63
                  : 0),
            )
          : programMutationScope
            ? programMutationScope.max_inventory_transfers
            : context.capability.actionKind === "equip"
              ? 1
              : 0,
        manual_override_policy: context.manualOverridePolicy,
        require_postcondition_verification: true,
        world_mutation_allowed:
          context.capability.effectClass === "world_mutation" ||
          programMutationScope?.world_mutation_allowed === true,
        combat_allowed: context.capability.actionKind === "attack",
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
    admittedActionRefs = {
      actionRequestRef: queued.action_request_id,
      workflowRef: queued.workflow_id,
    };
    let abortCancellation: Promise<unknown> | null = null;
    const cancelOnAbort = (): void => {
      if (abortCancellation) return;
      abortCancellation = deps
        .requestControl({
          roomId,
          profileId,
          environmentBindingId: context.environmentBindingId,
          actionAuthorityId: context.actionAuthorityId,
          workflowId: queued.workflow_id,
          controlKind: "cancel",
          reason:
            "The owning Helix Ask turn ended or its action deadline elapsed before the player-action observation returned.",
        })
        .catch(() => null);
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
      if (
        isEnvironmentActionBrokerError(error) &&
        error.code === "action_request_expired"
      ) cancelOnAbort();
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
                Object.entries(args).filter(
                  ([key]) => key !== "environment_label",
                ),
              ),
              idempotent_replay: idempotentReplay,
              physical_execution_performed: !idempotentReplay,
            },
          }
        : {
            error: observation.outcome,
            repairAction: environmentActionFailureRepairAction(
              observation.outcome,
              observation.summary,
            ),
          }),
    };
  } catch (error) {
    const outcome = isRoomEnvironmentSubjectError(error)
      ? error.code === "wrong_environment" || error.code === "wrong_world"
        ? "wrong_environment"
        : error.code === "subject_offline" ||
            error.code === "subject_binding_stale"
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
      ...(admittedActionRefs ?? {}),
    });
  }
};
