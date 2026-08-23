import crypto from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
  HELIX_AGENT_RUN_READ_SCOPE,
  HELIX_AGENT_RUN_WRITE_SCOPE,
  helixAgentCancelRequestSchema,
  helixAgentContinueRequestSchema,
  helixAgentEvidenceBundleSchema,
  helixAgentRunEventSchema,
  helixAgentRunSchema,
  helixAgentStartRequestSchema,
  type HelixAgentCancelRequest,
  type HelixAgentContinueRequest,
  type HelixAgentStartRequest,
} from "@shared/contracts/helix-agent-api.v1";
import {
  HELIX_SHARED_LIVE_ROOM_AGENT_API_VERSION,
  HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_CLAIM_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_CLAIM_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_UNBIND_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_UNBIND_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_CREATE_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_CREATE_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_INSPECT_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_INSPECT_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_LIST_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_LIST_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
  HELIX_SHARED_LIVE_ROOM_PRESENCE_SET_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_PRESENCE_SET_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
  HELIX_SHARED_LIVE_ROOM_RUN_BIND_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_RUN_BIND_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_RUN_UNBIND_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_RUN_UNBIND_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_SOURCE_LIST_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_SOURCE_LIST_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE,
  helixSharedLiveRoomChatBindingClaimRequestSchema,
  helixSharedLiveRoomChatBindingRevokeRequestSchema,
  helixSharedLiveRoomCreateRequestSchema,
  helixSharedLiveRoomErrorSchema,
  helixSharedLiveRoomIdSchema,
  helixSharedLiveRoomPresenceSetRequestSchema,
  helixSharedLiveRoomRunBindingRequestSchema,
  helixSharedLiveRoomRunBindingRevokeRequestSchema,
  helixSharedLiveRoomSourceCreateRequestSchema,
  type HelixSharedLiveRoomChatBindingClaimRequest,
  type HelixSharedLiveRoomChatBindingRevokeRequest,
  type HelixSharedLiveRoomCreateRequest,
  type HelixSharedLiveRoomRunBindingRequest,
  type HelixSharedLiveRoomRunBindingRevokeRequest,
  type HelixSharedLiveRoomSourceCreateRequest,
} from "@shared/contracts/helix-shared-live-room-agent.v1";
import {
  helixEnvironmentDeviceCheckListSchema,
  type HelixEnvironmentDeviceCheckList,
} from "@shared/helix-environment-device-check";
import {
  HELIX_ENVIRONMENT_ACTION_READ_SCOPE,
  HELIX_ENVIRONMENT_ACTION_WRITE_SCOPE,
  helixEnvironmentActionControlObservationSchema,
  helixEnvironmentActionObservationSchema,
} from "@shared/helix-environment-action";
import {
  HELIX_ENVIRONMENT_DURABLE_GOAL_APPEND_CAPABILITY,
  HELIX_ENVIRONMENT_DURABLE_GOAL_CREATE_CAPABILITY,
  HELIX_ENVIRONMENT_DURABLE_GOAL_INSPECT_CAPABILITY,
  helixEnvironmentDurableGoalAppendRequestSchema,
  helixEnvironmentDurableGoalObjectiveSchema,
  helixEnvironmentDurableGoalSha256,
  type HelixEnvironmentDurableGoalEventPayload,
  type HelixEnvironmentDurableGoalObjective,
  type HelixEnvironmentDurableGoalProjection,
} from "@shared/helix-environment-durable-goal";
import {
  HELIX_MINECRAFT_ACTOR_STATUS_READ_CAPABILITY,
  helixEnvironmentProbeObservationSchema,
} from "@shared/helix-environment-connector";
import {
  helixMinecraftFluidSequenceArgumentsSchema,
} from "@shared/helix-minecraft-fluid-sequence";
import {
  helixMinecraftReactiveProgramArgumentsSchema,
} from "@shared/helix-minecraft-reactive-program";
import {
  HELIX_MINECRAFT_PLAYER_CAMERA_TRACK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_CANCEL_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_COLLECT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_CRAFT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EMERGENCY_STOP_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EQUIP_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EXECUTE_REACTIVE_PROGRAM_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EXECUTE_SEQUENCE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_FOLLOW_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_HOTBAR_SELECT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_INTERACT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_INVENTORY_TRANSFER_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_JUMP_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_LOOK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_MINE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_NAVIGATE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_PLACE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_RESUME_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_STATUS_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_WALK_CAPABILITY,
  helixMinecraftPlayerActionArgumentsSchema,
} from "@shared/helix-minecraft-player-capabilities";
import { requireHelixAgentApiScope } from "../auth/helix-agent-principal";
import {
  buildHelixAgentApiError,
  HelixAgentApiService,
  HelixAgentApiServiceError,
} from "../services/helix-agent-api/service";
import type { HelixAgentApiPrincipal } from "../services/helix-agent-api/types";
import { SharedLiveRoomBindingStore } from "../services/shared-live-room-control/binding-store";
import {
  getSharedLiveRoomBindingStore,
  getSharedLiveRoomControlService,
} from "../services/shared-live-room-control/default-service";
import { buildSharedLiveRoomExternalError } from "../services/shared-live-room-control/external-errors";
import { sharedLiveRoomAgentApiService } from "../services/shared-live-room-control/agent-api-service";
import {
  buildSharedLiveRoomControlActorFromAgentPrincipal,
  SharedLiveRoomControlError,
  SharedLiveRoomControlService,
} from "../services/shared-live-room-control/service";
import {
  projectSharedLiveRoomChatBindingClaimReceipt,
  projectSharedLiveRoomChatBindingUnbindReceipt,
  projectSharedLiveRoomRunBindingReceipt,
  projectSharedLiveRoomRunUnbindReceipt,
} from "../services/shared-live-room-control/external-projections";
import { resolveCasimirPublicBaseUrl } from "../services/public-base-url";
import { buildEnvironmentConnectorDeviceCheckList } from
  "../services/environment-connectors/devices";
import {
  executeEnvironmentActionGatewayCapability,
  type EnvironmentActionGatewayExecution,
} from "../services/helix-ask/workstation-tool-gateway/environment-action";
import {
  executeEnvironmentActionControlGatewayCapability,
  type EnvironmentActionControlGatewayExecution,
} from "../services/helix-ask/workstation-tool-gateway/environment-action-control";
import {
  executeEnvironmentProbeGatewayCapability,
  type EnvironmentProbeGatewayExecution,
} from "../services/helix-ask/workstation-tool-gateway/environment-probe";
import {
  environmentDurableGoalStore,
  isEnvironmentDurableGoalError,
  type EnvironmentDurableGoalStore,
} from "../services/environment-connectors/goals";
import { extendEnvironmentActionAuthorityLease } from
  "../services/environment-connectors/actions/authority-store";
import { listStagePlayLiveSourceMailItems } from
  "../services/stage-play/stage-play-live-source-mailbox-store";

type RecordLike = Record<string, unknown>;

const HELIX_ROOM_RUN_ATTACHMENT_SCOPES = [
  HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
  HELIX_AGENT_RUN_WRITE_SCOPE,
] as const;
const HELIX_MINECRAFT_ACTION_MCP_SCOPES = [
  HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
  HELIX_ENVIRONMENT_ACTION_WRITE_SCOPE,
] as const;
const HELIX_MINECRAFT_STATUS_MCP_SCOPES = [
  HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
  HELIX_ENVIRONMENT_ACTION_READ_SCOPE,
] as const;

type HelixRunStartToolArguments = {
  idempotency_key: string;
  request: HelixAgentStartRequest;
};

type HelixRunContinueToolArguments = {
  run_id: string;
  idempotency_key: string;
  request: HelixAgentContinueRequest;
};

type HelixRunCancelToolArguments = {
  run_id: string;
  idempotency_key: string;
  request: HelixAgentCancelRequest;
};

type HelixRunIdToolArguments = {
  run_id: string;
};

type HelixRunEventsToolArguments = HelixRunIdToolArguments & {
  after_seq: number;
  limit: number;
};

type HelixRoomCreateToolArguments = {
  idempotency_key: string;
  request: HelixSharedLiveRoomCreateRequest;
};

type HelixRoomIdToolArguments = {
  room_id: string;
};

type HelixRoomPresenceSetToolArguments = {
  request: z.infer<typeof helixSharedLiveRoomPresenceSetRequestSchema>;
};

type HelixEnvironmentDeviceCheckToolArguments = {
  room_id?: string;
};

type HelixMinecraftPlayerActionToolArguments = {
  room_id: string;
  idempotency_key: string;
  environment_label?: string;
  action: RecordLike & { action_kind: string };
};

type HelixMinecraftActorStatusToolArguments = {
  room_id: string;
  environment_label?: string;
};

type HelixEnvironmentSemanticWakeReadToolArguments = {
  room_id: string;
  source_id?: string;
  after_observation_revision?: number;
  limit: number;
};

type HelixMinecraftWorkflowStatusToolArguments = {
  room_id: string;
  workflow_ref: string;
};

type HelixMinecraftWorkflowControlToolArguments =
  HelixMinecraftWorkflowStatusToolArguments & {
    control: "resume" | "cancel" | "emergency_stop";
    reason?: string;
  };

type HelixEnvironmentDurableGoalCreateToolArguments = {
  room_id: string;
  environment_binding_id: string;
  action_authority_id: string;
  subject_native_id: string;
  run_id?: string | null;
  turn_id: string;
  objective: HelixEnvironmentDurableGoalObjective;
};

type HelixEnvironmentDurableGoalInspectToolArguments = {
  room_id: string;
  goal_id: string;
};

type HelixEnvironmentDurableGoalAppendToolArguments = {
  room_id: string;
  environment_binding_id: string;
  goal_id: string;
  action_authority_id: string;
  subject_native_id: string;
  run_id?: string | null;
  turn_id: string;
  expected_revision: number;
  payload: HelixEnvironmentDurableGoalEventPayload;
  evidence_refs: string[];
};

type HelixEnvironmentGoalCheckpointHashToolArguments = {
  evidence_refs: string[];
  observation_revision: number;
  verified_facts: RecordLike;
  completed_postcondition_ids: string[];
  incomplete_postcondition_ids: string[];
};

type HelixEnvironmentActionAuthorityExtendToolArguments = {
  room_id: string;
  environment_binding_id: string;
  action_authority_id: string;
  expires_at: string;
};

export type HelixEnvironmentActionMcpExecutor =
  typeof executeEnvironmentActionGatewayCapability;
export type HelixEnvironmentActionControlMcpExecutor =
  typeof executeEnvironmentActionControlGatewayCapability;
export type HelixEnvironmentProbeMcpExecutor =
  typeof executeEnvironmentProbeGatewayCapability;
export type HelixEnvironmentDurableGoalMcpStore = Pick<
  EnvironmentDurableGoalStore,
  "create" | "inspect" | "append"
>;
export type HelixEnvironmentActionAuthorityLeaseExtender =
  typeof extendEnvironmentActionAuthorityLease;

export type HelixEnvironmentDeviceCheckServicePort = (input: {
  ownerProfileId: string;
  roomId?: string;
}) => Promise<HelixEnvironmentDeviceCheckList>;

type HelixRoomSourceCreateToolArguments = HelixRoomIdToolArguments & {
  idempotency_key: string;
  request: HelixSharedLiveRoomSourceCreateRequest;
};

type HelixRoomRunBindToolArguments = {
  request: HelixSharedLiveRoomRunBindingRequest;
};

type HelixRoomChatBindingClaimToolArguments = {
  request: HelixSharedLiveRoomChatBindingClaimRequest;
};

type HelixRoomRunUnbindToolArguments =
  HelixSharedLiveRoomRunBindingRevokeRequest;

type HelixRoomChatBindingUnbindToolArguments =
  HelixSharedLiveRoomChatBindingRevokeRequest;

type HelixRoomCommandRequestToolArguments = HelixRoomIdToolArguments & {
  command: string;
};

type McpOAuthSecurityScheme = {
  type: "oauth2";
  scopes: string[];
};

type RequiredOAuthScopes = string | readonly string[];

const DEFAULT_MCP_RESOURCE_METADATA_PATH =
  "/.well-known/oauth-protected-resource/mcp";
export const HELIX_DEVICE_CHECK_MCP_PATH = "/mcp/device-check";
export const HELIX_DEVICE_CHECK_RESOURCE_METADATA_PATH =
  "/.well-known/oauth-protected-resource/mcp/device-check";

type McpToolDefinitionLike = RecordLike & {
  name: string;
  _meta?: RecordLike;
};

type McpListToolsResultLike = RecordLike & {
  tools: McpToolDefinitionLike[];
};

type McpLowLevelRequestHandler = (
  request: unknown,
  extra: unknown,
) => Promise<unknown> | unknown;

type McpSdkRequestHandlerInternals = {
  _requestHandlers: Map<string, McpLowLevelRequestHandler>;
};

const jsonObjectSchema = z.object({}).passthrough();
const projectedRunSchema = helixAgentRunSchema.partial().passthrough();

const runMutationOutputSchema = (operation: "start" | "continue" | "cancel") =>
  z
    .object({
      operation: z.literal(operation),
      idempotency_replayed: z.boolean(),
      run: projectedRunSchema,
    })
    .strict();

const runInspectOutputSchema = z
  .object({
    operation: z.literal("inspect"),
    run: projectedRunSchema,
  })
  .strict();

const runEvidenceOutputSchema = z
  .object({
    operation: z.literal("fetch_evidence"),
    evidence: helixAgentEvidenceBundleSchema,
  })
  .strict();

const runEventsOutputSchema = z
  .object({
    operation: z.literal("list_events"),
    page: z
      .object({
        schema: z.literal("helix.agent_run.events_page.v1"),
        run_id: z.string(),
        events: z.array(helixAgentRunEventSchema),
        next_after_seq: z.number().int().min(0),
        has_more: z.boolean(),
      })
      .strict(),
  })
  .strict();

const roomReceiptAuthorityFields = {
  api_version: z.literal(HELIX_SHARED_LIVE_ROOM_AGENT_API_VERSION),
  ok: z.literal(true),
  reentry_required: z.literal(true),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
  raw_content_included: z.literal(false),
};

const roomListOutputSchema = z
  .object({
    ...roomReceiptAuthorityFields,
    schema: z.literal(HELIX_SHARED_LIVE_ROOM_LIST_RECEIPT_SCHEMA),
    operation: z.literal(HELIX_SHARED_LIVE_ROOM_LIST_CAPABILITY),
    content_role: z.literal("room_control_observation_not_assistant_answer"),
    rooms: z.array(jsonObjectSchema),
  })
  .passthrough();

const roomInspectOutputSchema = z
  .object({
    ...roomReceiptAuthorityFields,
    schema: z.literal(HELIX_SHARED_LIVE_ROOM_INSPECT_RECEIPT_SCHEMA),
    operation: z.literal(HELIX_SHARED_LIVE_ROOM_INSPECT_CAPABILITY),
    content_role: z.literal("room_control_observation_not_assistant_answer"),
    room: jsonObjectSchema,
  })
  .passthrough();

const roomPresenceSetOutputSchema = z
  .object({
    ...roomReceiptAuthorityFields,
    schema: z.literal(HELIX_SHARED_LIVE_ROOM_PRESENCE_SET_RECEIPT_SCHEMA),
    operation: z.literal(HELIX_SHARED_LIVE_ROOM_PRESENCE_SET_CAPABILITY),
    content_role: z.literal("room_control_receipt_not_assistant_answer"),
    room: jsonObjectSchema,
  })
  .passthrough();

const roomCreateReceiptOutputSchema = z
  .object({
    ...roomReceiptAuthorityFields,
    schema: z.literal(HELIX_SHARED_LIVE_ROOM_CREATE_RECEIPT_SCHEMA),
    operation: z.literal(HELIX_SHARED_LIVE_ROOM_CREATE_CAPABILITY),
    content_role: z.literal("room_control_receipt_not_assistant_answer"),
    room: jsonObjectSchema,
  })
  .passthrough();

const roomCreateOutputSchema = z
  .object({
    operation: z.literal("room.create"),
    idempotency_replayed: z.boolean(),
    receipt: roomCreateReceiptOutputSchema,
  })
  .strict();

const roomRunBindOutputSchema = z
  .object({
    ...roomReceiptAuthorityFields,
    schema: z.literal(HELIX_SHARED_LIVE_ROOM_RUN_BIND_RECEIPT_SCHEMA),
    operation: z.literal(HELIX_SHARED_LIVE_ROOM_RUN_BIND_CAPABILITY),
    content_role: z.literal("room_control_receipt_not_assistant_answer"),
    binding_ref: z.string(),
    run_id: z.string(),
    room_id: z.string(),
    binding_status: z.literal("active"),
    version: z.number().int().positive(),
  })
  .strict();

const roomChatBindingClaimOutputSchema = z
  .object({
    ...roomReceiptAuthorityFields,
    schema: z.literal(HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_CLAIM_RECEIPT_SCHEMA),
    operation: z.literal(HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_CLAIM_CAPABILITY),
    content_role: z.literal("room_control_receipt_not_assistant_answer"),
    binding_ref: z.string(),
    run_id: z.string(),
    binding_status: z.literal("active"),
    context_snapshot_ref: z.string().nullable(),
    context_message_count: z.number().int().min(0),
    context_char_count: z.number().int().min(0),
  })
  .strict();

const roomRunUnbindOutputSchema = z
  .object({
    ...roomReceiptAuthorityFields,
    schema: z.literal(HELIX_SHARED_LIVE_ROOM_RUN_UNBIND_RECEIPT_SCHEMA),
    operation: z.literal(HELIX_SHARED_LIVE_ROOM_RUN_UNBIND_CAPABILITY),
    content_role: z.literal("room_control_receipt_not_assistant_answer"),
    binding_ref: z.string(),
    binding_status: z.literal("revoked"),
    revocation_status: z.enum(["revoked", "already_revoked"]),
  })
  .strict();

const roomChatBindingUnbindOutputSchema = z
  .object({
    ...roomReceiptAuthorityFields,
    schema: z.literal(
      HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_UNBIND_RECEIPT_SCHEMA,
    ),
    operation: z.literal(HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_UNBIND_CAPABILITY),
    content_role: z.literal("room_control_receipt_not_assistant_answer"),
    binding_ref: z.string(),
    binding_status: z.literal("revoked"),
    revocation_status: z.enum(["revoked", "already_revoked"]),
  })
  .strict();

const roomSourceListOutputSchema = z
  .object({
    ...roomReceiptAuthorityFields,
    schema: z.literal(HELIX_SHARED_LIVE_ROOM_SOURCE_LIST_RECEIPT_SCHEMA),
    operation: z.literal(HELIX_SHARED_LIVE_ROOM_SOURCE_LIST_CAPABILITY),
    content_role: z.literal("source_binding_observation_not_assistant_answer"),
    room_id: z.string(),
    bindings: z.array(jsonObjectSchema),
  })
  .passthrough();

const roomSourceCreateReceiptOutputSchema = z
  .object({
    ...roomReceiptAuthorityFields,
    schema: z.literal(HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_RECEIPT_SCHEMA),
    operation: z.literal(HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_CAPABILITY),
    content_role: z.literal("source_binding_receipt_not_assistant_answer"),
    room_id: z.string(),
    binding: jsonObjectSchema,
    credential_delivery: jsonObjectSchema,
    execution_enabled: z.literal(false),
    command_execution_enabled: z.literal(false),
  })
  .passthrough();

const roomSourceCreateOutputSchema = z
  .object({
    operation: z.literal("room.source.create"),
    idempotency_replayed: z.boolean(),
    receipt: roomSourceCreateReceiptOutputSchema,
  })
  .strict();

const minecraftPlayerActionInputSchema = z.union([
  helixMinecraftPlayerActionArgumentsSchema,
  helixMinecraftFluidSequenceArgumentsSchema,
  helixMinecraftReactiveProgramArgumentsSchema,
]);

const normalizeMinecraftMcpActionArguments = (
  action: RecordLike & { action_kind: string },
): RecordLike => {
  const { action_kind: _actionKind, ...argumentsValue } = action;
  if (
    (action.action_kind === "look_at" || action.action_kind === "track_target") &&
    argumentsValue.target &&
    typeof argumentsValue.target === "object" &&
    !Array.isArray(argumentsValue.target)
  ) {
    const { target, ...remaining } = argumentsValue;
    return { ...remaining, ...(target as RecordLike) };
  }
  return argumentsValue;
};

const minecraftPlayerActionOutputSchema = z
  .object({
    operation: z.literal("minecraft.player.action"),
    room_id: helixSharedLiveRoomIdSchema,
    ok: z.boolean(),
    status: z.enum(["completed", "blocked", "failed"]),
    summary: z.string(),
    idempotency_replayed: z.boolean(),
    observation: helixEnvironmentActionObservationSchema,
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

const minecraftActorStatusOutputSchema = z
  .object({
    operation: z.literal("minecraft.actor.status.read"),
    room_id: helixSharedLiveRoomIdSchema,
    ok: z.boolean(),
    status: z.enum(["completed", "blocked", "failed"]),
    summary: z.string(),
    observation: helixEnvironmentProbeObservationSchema,
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

const environmentSemanticWakeReadOutputSchema = z
  .object({
    operation: z.literal("environment.semantic_wake.read"),
    room_id: helixSharedLiveRoomIdSchema,
    items: z.array(
      z.object({
        mail_id: z.string(),
        source_id: z.string(),
        room_source_binding_id: z.string(),
        world_id: z.string(),
        producer_plane: z.enum(["world_authority", "player_embodiment"]),
        producer_epoch_ref: z.string(),
        subject_ref: z.string().nullable(),
        participant_id: z.string(),
        selected_player_native_id: z.string().nullable(),
        observation_revision: z.number().int().min(0),
        digest_id: z.string(),
        digest_hash: z.string(),
        semantic_evidence: jsonObjectSchema,
        summary_preview: z.string(),
        evidence_refs: z.array(z.string()),
        created_at: z.string(),
        freshness: z.enum(["fresh", "stale"]),
      }).strict(),
    ),
    content_role: z.literal("environment_semantic_wake_observation_not_assistant_answer"),
    reentry_required: z.literal(true),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

const minecraftWorkflowControlOutputSchema = z
  .object({
    operation: z.enum([
      "minecraft.player.workflow.status",
      "minecraft.player.workflow.control",
    ]),
    room_id: helixSharedLiveRoomIdSchema,
    ok: z.boolean(),
    status: z.enum(["completed", "blocked", "failed"]),
    summary: z.string(),
    observation: helixEnvironmentActionControlObservationSchema,
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

const environmentDurableGoalOutputSchema = z
  .object({
    operation: z.enum([
      HELIX_ENVIRONMENT_DURABLE_GOAL_CREATE_CAPABILITY,
      HELIX_ENVIRONMENT_DURABLE_GOAL_INSPECT_CAPABILITY,
      HELIX_ENVIRONMENT_DURABLE_GOAL_APPEND_CAPABILITY,
    ]),
    room_id: helixSharedLiveRoomIdSchema,
    ok: z.literal(true),
    goal: jsonObjectSchema,
    content_role: z.literal("environment_durable_goal_observation_not_assistant_answer"),
    reentry_required: z.literal(true),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

const environmentGoalCheckpointHashOutputSchema = z
  .object({
    operation: z.literal("environment.durable_goal.checkpoint_hash"),
    checkpoint_evidence_hash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
    content_role: z.literal("environment_checkpoint_hash_observation_not_assistant_answer"),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

const environmentActionAuthorityExtendOutputSchema = z
  .object({
    operation: z.literal("environment.action_authority.extend"),
    room_id: helixSharedLiveRoomIdSchema,
    authority: jsonObjectSchema,
    content_role: z.literal("environment_action_authority_receipt_not_assistant_answer"),
    reentry_required: z.literal(true),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

const durableGoalMcpObservation = (
  operation:
    | typeof HELIX_ENVIRONMENT_DURABLE_GOAL_CREATE_CAPABILITY
    | typeof HELIX_ENVIRONMENT_DURABLE_GOAL_INSPECT_CAPABILITY
    | typeof HELIX_ENVIRONMENT_DURABLE_GOAL_APPEND_CAPABILITY,
  roomId: string,
  goal: HelixEnvironmentDurableGoalProjection,
): RecordLike => ({
  operation,
  room_id: roomId,
  ok: true,
  goal,
  content_role: "environment_durable_goal_observation_not_assistant_answer",
  reentry_required: true,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
});

const minecraftCapabilityIdForActionKind = (
  actionKind: string,
): string | null => {
  switch (actionKind) {
    case "navigate_to": return HELIX_MINECRAFT_PLAYER_NAVIGATE_CAPABILITY;
    case "look_at": return HELIX_MINECRAFT_PLAYER_LOOK_CAPABILITY;
    case "track_target": return HELIX_MINECRAFT_PLAYER_CAMERA_TRACK_CAPABILITY;
    case "walk": return HELIX_MINECRAFT_PLAYER_WALK_CAPABILITY;
    case "jump": return HELIX_MINECRAFT_PLAYER_JUMP_CAPABILITY;
    case "interact": return HELIX_MINECRAFT_PLAYER_INTERACT_CAPABILITY;
    case "hotbar_select": return HELIX_MINECRAFT_PLAYER_HOTBAR_SELECT_CAPABILITY;
    case "equip": return HELIX_MINECRAFT_PLAYER_EQUIP_CAPABILITY;
    case "follow": return HELIX_MINECRAFT_PLAYER_FOLLOW_CAPABILITY;
    case "collect": return HELIX_MINECRAFT_PLAYER_COLLECT_CAPABILITY;
    case "mine": return HELIX_MINECRAFT_PLAYER_MINE_CAPABILITY;
    case "place": return HELIX_MINECRAFT_PLAYER_PLACE_CAPABILITY;
    case "craft": return HELIX_MINECRAFT_PLAYER_CRAFT_CAPABILITY;
    case "inventory_transfer":
      return HELIX_MINECRAFT_PLAYER_INVENTORY_TRANSFER_CAPABILITY;
    case "execute_sequence":
      return HELIX_MINECRAFT_PLAYER_EXECUTE_SEQUENCE_CAPABILITY;
    case "execute_reactive_program":
      return HELIX_MINECRAFT_PLAYER_EXECUTE_REACTIVE_PROGRAM_CAPABILITY;
    default: return null;
  }
};

const minecraftControlCapabilityId = (
  control: "status" | "resume" | "cancel" | "emergency_stop",
): string => {
  switch (control) {
    case "status": return HELIX_MINECRAFT_PLAYER_STATUS_CAPABILITY;
    case "resume": return HELIX_MINECRAFT_PLAYER_RESUME_CAPABILITY;
    case "cancel": return HELIX_MINECRAFT_PLAYER_CANCEL_CAPABILITY;
    case "emergency_stop":
      return HELIX_MINECRAFT_PLAYER_EMERGENCY_STOP_CAPABILITY;
  }
};

const minecraftMcpIdentityDigest = (input: {
  principal: HelixAgentApiPrincipal;
  idempotencyKey: string;
}): string => crypto
  .createHash("sha256")
  .update([
    input.principal.tenantId,
    input.principal.issuer,
    input.principal.subjectId,
    input.principal.accountProfileId,
    input.idempotencyKey,
  ].join("\n"), "utf8")
  .digest("hex")
  .slice(0, 40);

const oauthSecuritySchemes = (
  requiredScopes: RequiredOAuthScopes,
): McpOAuthSecurityScheme[] => [
  {
    type: "oauth2",
    scopes:
      typeof requiredScopes === "string"
        ? [requiredScopes]
        : Array.from(new Set(requiredScopes)),
  },
];

const oauthToolMeta = (requiredScopes: RequiredOAuthScopes): RecordLike => ({
  securitySchemes: oauthSecuritySchemes(requiredScopes),
});

const quoteAuthenticateParameter = (value: string): string =>
  value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

const normalizeRequiredScopes = (
  requiredScopes: RequiredOAuthScopes,
): string[] =>
  typeof requiredScopes === "string"
    ? [requiredScopes]
    : Array.from(new Set(requiredScopes));

const oauthScopeTokenPattern = /^[\x21\x23-\x5b\x5d-\x7e]+$/;

const dynamicRequiredOAuthScopes = (
  error: HelixAgentApiServiceError,
): string[] => {
  const candidates = error.details?.required_oauth_scopes;
  if (!Array.isArray(candidates)) return [];
  return Array.from(
    new Set(
      candidates.filter(
        (candidate: unknown): candidate is string =>
          typeof candidate === "string" &&
          candidate.length <= 240 &&
          oauthScopeTokenPattern.test(candidate),
      ),
    ),
  ).slice(0, 64);
};

const challengeScopesForError = (
  error: HelixAgentApiServiceError,
  fallbackScopes: RequiredOAuthScopes,
): RequiredOAuthScopes => {
  const requiredScopes = dynamicRequiredOAuthScopes(error);
  return requiredScopes.length > 0 ? requiredScopes : fallbackScopes;
};

const insufficientScopeChallenge = (
  requiredScopes: RequiredOAuthScopes,
  resourceMetadataPath = DEFAULT_MCP_RESOURCE_METADATA_PATH,
): string => {
  const scopes = normalizeRequiredScopes(requiredScopes);
  const scopeValue = scopes.join(" ");
  const resourceMetadataUrl =
    `${resolveCasimirPublicBaseUrl()}` +
    resourceMetadataPath;
  return [
    "Bearer",
    `resource_metadata="${quoteAuthenticateParameter(resourceMetadataUrl)}"`,
    'error="insufficient_scope"',
    `error_description="${quoteAuthenticateParameter(
      `The bearer token is missing one or more required scopes: ${scopeValue}.`,
    )}"`,
    `scope="${quoteAuthenticateParameter(scopeValue)}"`,
  ].join(", ");
};

const installOAuthToolCatalogAugmentation = (
  server: McpServer,
  requiredScopesByTool: ReadonlyMap<string, RequiredOAuthScopes>,
): void => {
  const lowLevelServer =
    server.server as unknown as McpSdkRequestHandlerInternals;
  const sdkHandler = lowLevelServer._requestHandlers?.get("tools/list");
  if (!sdkHandler) {
    throw new Error("mcp_sdk_tools_list_handler_unavailable");
  }
  server.server.setRequestHandler(
    ListToolsRequestSchema,
    async (request: unknown, extra: unknown) => {
      const result = (await sdkHandler(
        request,
        extra,
      )) as McpListToolsResultLike;
      return {
        ...result,
        tools: result.tools.map((tool: McpToolDefinitionLike) => {
          const requiredScopes = requiredScopesByTool.get(tool.name);
          if (!requiredScopes) return tool;
          const securitySchemes = oauthSecuritySchemes(requiredScopes);
          return {
            ...tool,
            securitySchemes,
            _meta: {
              ...(tool._meta ?? {}),
              securitySchemes,
            },
          };
        }),
      } as never;
    },
  );
};

const toolSuccess = (value: RecordLike) => ({
  content: [
    {
      type: "text" as const,
      text: JSON.stringify(value),
    },
  ],
  structuredContent: value,
});

const environmentObservationToolResult = (
  value: RecordLike,
  ok: boolean,
) => ({
  ...toolSuccess(value),
  ...(!ok ? { isError: true as const } : {}),
});

const toolError = (
  error: unknown,
  requiredScopes: RequiredOAuthScopes,
  resourceMetadataPath = DEFAULT_MCP_RESOURCE_METADATA_PATH,
) => {
  const normalized =
    error instanceof HelixAgentApiServiceError
      ? error
      : new HelixAgentApiServiceError(
          500,
          "internal_error",
          "The Helix agent tool could not complete the request.",
          true,
        );
  const value = buildHelixAgentApiError({
    error: normalized,
    requestId: null,
  });
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value),
      },
    ],
    structuredContent: value,
    ...(normalized.code === "insufficient_scope"
      ? {
          _meta: {
            "mcp/www_authenticate": [
              insufficientScopeChallenge(
                challengeScopesForError(normalized, requiredScopes),
                resourceMetadataPath,
              ),
            ],
          },
        }
      : {}),
  };
};

const roomToolError = (error: unknown, requiredScopes: RequiredOAuthScopes) => {
  if (isEnvironmentDurableGoalError(error)) {
    const value = {
      schema: "helix.environment_durable_goal_error.v1",
      error: error.code,
      message: error.message,
      retryable: error.statusCode >= 500,
      evidence_refs: error.evidenceRefs,
      mismatch_reasons: error.mismatchReasons,
      content_role: "environment_durable_goal_error_not_assistant_answer",
      reentry_required: true,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
    };
    return {
      isError: true,
      content: [{ type: "text" as const, text: JSON.stringify(value) }],
      structuredContent: value,
    };
  }
  if (
    !(error instanceof SharedLiveRoomControlError) &&
    !(error instanceof HelixAgentApiServiceError)
  ) {
    console.error("[helix-mcp] unexpected room tool error", {
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : "non_error_value",
    });
  }
  const value = buildSharedLiveRoomExternalError({
    error,
    requestId: null,
  }).body;
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value),
      },
    ],
    structuredContent: value as unknown as RecordLike,
    ...(value.error === "insufficient_scope"
      ? {
          _meta: {
            "mcp/www_authenticate": [
              insufficientScopeChallenge(requiredScopes),
            ],
          },
        }
      : {}),
  };
};

const callTool = async (
  requiredScopes: RequiredOAuthScopes,
  operation: () => Promise<RecordLike>,
  resourceMetadataPath = DEFAULT_MCP_RESOURCE_METADATA_PATH,
) => {
  try {
    return toolSuccess(await operation());
  } catch (error) {
    return toolError(error, requiredScopes, resourceMetadataPath);
  }
};

const requireSharedLiveRoomFeature = (
  principal: HelixAgentApiPrincipal,
): void => {
  const policy = principal.accountContext.account_policy;
  if (
    !policy ||
    !policy.feature_flags.includes("shared_realtime_rooms") ||
    policy.locked_features.includes("shared_realtime_rooms")
  ) {
    throw new SharedLiveRoomControlError(
      403,
      "account_policy_blocked",
      "Shared Live Rooms are locked by the active account policy.",
    );
  }
};

const registerEnvironmentDeviceCheckTool = (input: {
  server: McpServer;
  principal: HelixAgentApiPrincipal;
  deviceCheckService: HelixEnvironmentDeviceCheckServicePort;
  resourceMetadataPath?: string;
}): void => {
  input.server.registerTool(
    "helix_environment_device_check",
    {
      title: "Check environment connector devices",
      description:
        "Returns current, owner-scoped connector identity, freshness, and probe-readiness observations. It never returns credentials, raw observations, device public keys, or an assistant answer.",
      inputSchema: z
        .object({
          room_id: helixSharedLiveRoomIdSchema.optional(),
        })
        .strict(),
      outputSchema: helixEnvironmentDeviceCheckListSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_READ_SCOPE),
    },
    async ({ room_id }: HelixEnvironmentDeviceCheckToolArguments) =>
      callTool(
        HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
        async () => {
          requireHelixAgentApiScope(
            input.principal,
            HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
          );
          requireSharedLiveRoomFeature(input.principal);
          return await input.deviceCheckService({
            ownerProfileId: input.principal.accountProfileId,
            roomId: room_id,
          });
        },
        input.resourceMetadataPath,
      ),
  );
};

export const createHelixDeviceCheckMcpServer = (input: {
  principal: HelixAgentApiPrincipal;
  deviceCheckService?: HelixEnvironmentDeviceCheckServicePort;
}): McpServer => {
  const server = new McpServer(
    {
      name: "casimirbot-device-check",
      version: "1.0.0",
    },
    {
      instructions: [
        "This MCP resource exposes only owner-scoped, read-only environment connector observations.",
        "Tool output is evidence, not an assistant answer, and is never terminal-eligible.",
        "Credentials, device public keys, and raw observations are never returned.",
      ].join(" "),
    },
  );
  registerEnvironmentDeviceCheckTool({
    server,
    principal: input.principal,
    deviceCheckService:
      input.deviceCheckService ?? buildEnvironmentConnectorDeviceCheckList,
    resourceMetadataPath: HELIX_DEVICE_CHECK_RESOURCE_METADATA_PATH,
  });
  installOAuthToolCatalogAugmentation(
    server,
    new Map<string, RequiredOAuthScopes>([
      ["helix_environment_device_check", HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
    ]),
  );
  return server;
};

const callRoomTool = async (
  requiredScopes: RequiredOAuthScopes,
  operation: () => Promise<RecordLike>,
) => {
  try {
    return toolSuccess(await operation());
  } catch (error) {
    return roomToolError(error, requiredScopes);
  }
};

const callRoomObservationTool = async (
  requiredScopes: RequiredOAuthScopes,
  operation: () => Promise<{ value: RecordLike; ok: boolean }>,
) => {
  try {
    const result = await operation();
    return environmentObservationToolResult(result.value, result.ok);
  } catch (error) {
    return roomToolError(error, requiredScopes);
  }
};

const idempotencyKeySchema = z
  .string()
  .trim()
  .min(8)
  .max(200)
  .describe(
    "Caller-stable idempotency key; JSON-RPC request IDs are not substitutes.",
  );

const runIdSchema = z
  .string()
  .trim()
  .regex(/^run_[A-Za-z0-9._:-]{8,200}$/)
  .describe("Opaque durable run ID returned by helix_run_start.");

export const createHelixMcpServer = (input: {
  principal: HelixAgentApiPrincipal;
  service?: HelixAgentApiService;
  roomControlService?: SharedLiveRoomControlService;
  roomBindingStore?: Pick<
    SharedLiveRoomBindingStore,
    | "bindRunToRoom"
    | "claimPendingChatBinding"
    | "revokeRunRoomBindingForOwner"
    | "revokeClaimedRunChatBindingForOwner"
  >;
  deviceCheckService?: HelixEnvironmentDeviceCheckServicePort;
  environmentActionExecutor?: HelixEnvironmentActionMcpExecutor;
  environmentActionControlExecutor?: HelixEnvironmentActionControlMcpExecutor;
  environmentProbeExecutor?: HelixEnvironmentProbeMcpExecutor;
  environmentDurableGoalService?: HelixEnvironmentDurableGoalMcpStore;
  environmentActionAuthorityLeaseExtender?: HelixEnvironmentActionAuthorityLeaseExtender;
}): McpServer => {
  const service = input.service ?? sharedLiveRoomAgentApiService;
  const roomControlService =
    input.roomControlService ?? getSharedLiveRoomControlService();
  const roomBindingStore =
    input.roomBindingStore ?? getSharedLiveRoomBindingStore();
  const roomActor = buildSharedLiveRoomControlActorFromAgentPrincipal(
    input.principal,
  );
  const deviceCheckService =
    input.deviceCheckService ?? buildEnvironmentConnectorDeviceCheckList;
  const environmentActionExecutor =
    input.environmentActionExecutor ?? executeEnvironmentActionGatewayCapability;
  const environmentActionControlExecutor =
    input.environmentActionControlExecutor ??
      executeEnvironmentActionControlGatewayCapability;
  const environmentProbeExecutor =
    input.environmentProbeExecutor ?? executeEnvironmentProbeGatewayCapability;
  const durableGoalService =
    input.environmentDurableGoalService ?? environmentDurableGoalStore;
  const actionAuthorityLeaseExtender =
    input.environmentActionAuthorityLeaseExtender ??
      extendEnvironmentActionAuthorityLease;
  const roomOwner = {
    tenantId: input.principal.tenantId,
    issuer: input.principal.issuer,
    subjectId: input.principal.subjectId,
    accountProfileId: input.principal.accountProfileId,
  };
  const requireCurrentRoomFeature = (): void =>
    requireSharedLiveRoomFeature(input.principal);
  const requireAllAgentScopes = (requiredScopes: readonly string[]): void => {
    const missing = Array.from(
      new Set(
        requiredScopes.filter(
          (scope: string) => !input.principal.scopes.has(scope),
        ),
      ),
    );
    if (missing.length === 0) return;
    throw new HelixAgentApiServiceError(
      403,
      "insufficient_scope",
      `The bearer token is missing the required ${missing.join(", ")} scope${
        missing.length === 1 ? "" : "s"
      }.`,
      false,
      {
        required_scope: missing[0],
        required_oauth_scopes: missing,
      },
    );
  };
  const resolveSelfParticipantId = async (roomId: string): Promise<string> => {
    const inspected = await roomControlService.inspectRoom({
      actor: roomActor,
      roomId,
    });
    return inspected.room.self_participant_id;
  };
  const server = new McpServer(
    {
      name: "casimirbot-helix-agent",
      version: "1.0.0",
    },
    {
      instructions: [
        "Use the durable run_id returned by helix_run_start for all later calls.",
        "Mutations require a caller-stable idempotency_key and continuations require expected_version.",
        "completion_status and terminal_authority_status are separate. Evidence and MCP tool output are not assistant answers.",
        "Room and source receipts are non-authoritative; source creation returns only an opaque secure-delivery handle, never a source bearer.",
        "Raw Shared Live Room server-command execution is disabled. Typed Minecraft player actions use a separately paired action authority; sensor credentials are never action credentials.",
        "Minecraft action and workflow-control results are observations for Codex re-entry, never assistant answers or terminal authority.",
        "Durable environment-goal projections are checkpoint context for Codex re-entry; they never choose strategy, write an answer, or grant terminal authority.",
        "Continue only while progress is possible and within the declared run budget.",
      ].join(" "),
    },
  );

  server.registerTool(
    "helix_run_start",
    {
      title: "Start a durable Helix agent run",
      description:
        "Creates a tenant/account-owned bounded run. It stores the objective and completion contract but does not itself claim the objective is solved.",
      inputSchema: z
        .object({
          idempotency_key: idempotencyKeySchema,
          request: helixAgentStartRequestSchema,
        })
        .strict(),
      outputSchema: runMutationOutputSchema("start"),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_AGENT_RUN_WRITE_SCOPE),
    },
    async ({ idempotency_key, request }: HelixRunStartToolArguments) =>
      callTool(HELIX_AGENT_RUN_WRITE_SCOPE, async () => {
        requireHelixAgentApiScope(input.principal, HELIX_AGENT_RUN_WRITE_SCOPE);
        const result = await service.startRun({
          principal: input.principal,
          idempotencyKey: idempotency_key,
          request,
        });
        return {
          operation: "start",
          idempotency_replayed: result.idempotencyReplayed,
          run: result.body,
        };
      }),
  );

  server.registerTool(
    "helix_run_continue",
    {
      title: "Continue a durable Helix agent run",
      description:
        "Runs one bounded continuation through the full Helix Ask solver and persists evidence and terminal-authority projection.",
      inputSchema: z
        .object({
          run_id: runIdSchema,
          idempotency_key: idempotencyKeySchema,
          request: helixAgentContinueRequestSchema,
        })
        .strict(),
      outputSchema: runMutationOutputSchema("continue"),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
      _meta: oauthToolMeta(HELIX_AGENT_RUN_WRITE_SCOPE),
    },
    async ({
      run_id,
      idempotency_key,
      request,
    }: HelixRunContinueToolArguments) =>
      callTool(HELIX_AGENT_RUN_WRITE_SCOPE, async () => {
        requireHelixAgentApiScope(input.principal, HELIX_AGENT_RUN_WRITE_SCOPE);
        const result = await service.continueRun({
          principal: input.principal,
          runId: run_id,
          idempotencyKey: idempotency_key,
          request,
        });
        return {
          operation: "continue",
          idempotency_replayed: result.idempotencyReplayed,
          run: result.body,
        };
      }),
  );

  server.registerTool(
    "helix_run_cancel",
    {
      title: "Cancel a durable Helix agent run",
      description:
        "Irreversibly closes a nonterminal run for further continuation while preserving its durable audit events.",
      inputSchema: z
        .object({
          run_id: runIdSchema,
          idempotency_key: idempotencyKeySchema,
          request: helixAgentCancelRequestSchema,
        })
        .strict(),
      outputSchema: runMutationOutputSchema("cancel"),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_AGENT_RUN_WRITE_SCOPE),
    },
    async ({ run_id, idempotency_key, request }: HelixRunCancelToolArguments) =>
      callTool(HELIX_AGENT_RUN_WRITE_SCOPE, async () => {
        requireHelixAgentApiScope(input.principal, HELIX_AGENT_RUN_WRITE_SCOPE);
        const result = await service.cancelRun({
          principal: input.principal,
          runId: run_id,
          idempotencyKey: idempotency_key,
          request,
        });
        return {
          operation: "cancel",
          idempotency_replayed: result.idempotencyReplayed,
          run: result.body,
        };
      }),
  );

  server.registerTool(
    "helix_run_inspect",
    {
      title: "Inspect a durable Helix agent run",
      description:
        "Returns the owner-scoped run snapshot, bounded status, completion status, and terminal-authority status.",
      inputSchema: z.object({ run_id: runIdSchema }).strict(),
      outputSchema: runInspectOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_AGENT_RUN_READ_SCOPE),
    },
    async ({ run_id }: HelixRunIdToolArguments) =>
      callTool(HELIX_AGENT_RUN_READ_SCOPE, async () => {
        requireHelixAgentApiScope(input.principal, HELIX_AGENT_RUN_READ_SCOPE);
        return {
          operation: "inspect",
          run: await service.inspectRun({
            principal: input.principal,
            runId: run_id,
          }),
        };
      }),
  );

  server.registerTool(
    "helix_run_fetch_evidence",
    {
      title: "Fetch a run evidence bundle",
      description:
        "Returns normalized evidence and receipt references. The bundle is supporting evidence, never terminal answer authority.",
      inputSchema: z.object({ run_id: runIdSchema }).strict(),
      outputSchema: runEvidenceOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_AGENT_RUN_READ_SCOPE),
    },
    async ({ run_id }: HelixRunIdToolArguments) =>
      callTool(HELIX_AGENT_RUN_READ_SCOPE, async () => {
        requireHelixAgentApiScope(input.principal, HELIX_AGENT_RUN_READ_SCOPE);
        return {
          operation: "fetch_evidence",
          evidence: await service.fetchEvidence({
            principal: input.principal,
            runId: run_id,
          }),
        };
      }),
  );

  server.registerTool(
    "helix_run_list_events",
    {
      title: "List durable run events",
      description:
        "Returns a monotonically sequenced owner-scoped event page for polling and audit.",
      inputSchema: z
        .object({
          run_id: runIdSchema,
          after_seq: z.number().int().min(0).default(0),
          limit: z.number().int().min(1).max(200).default(100),
        })
        .strict(),
      outputSchema: runEventsOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_AGENT_RUN_READ_SCOPE),
    },
    async ({ run_id, after_seq, limit }: HelixRunEventsToolArguments) =>
      callTool(HELIX_AGENT_RUN_READ_SCOPE, async () => {
        requireHelixAgentApiScope(input.principal, HELIX_AGENT_RUN_READ_SCOPE);
        return {
          operation: "list_events",
          page: await service.listEvents({
            principal: input.principal,
            runId: run_id,
            afterSeq: after_seq,
            limit,
          }),
        };
      }),
  );

  registerEnvironmentDeviceCheckTool({
    server,
    principal: input.principal,
    deviceCheckService,
  });

  server.registerTool(
    "helix_environment_goal_create",
    {
      title: "Create a durable environment goal",
      description:
        "Creates an append-only Minecraft survival goal bound to the current room participant, selected player, source, world, connector epoch, and action authority. The projection is context for Codex re-entry, never an answer or strategy writer.",
      inputSchema: z.object({
        room_id: helixSharedLiveRoomIdSchema,
        environment_binding_id: z.string().trim().min(1).max(320),
        action_authority_id: z.string().trim().min(1).max(320),
        subject_native_id: z.string().trim().min(1).max(320),
        run_id: z.string().trim().min(1).max(320).nullable().optional(),
        turn_id: z.string().trim().min(1).max(320),
        objective: helixEnvironmentDurableGoalObjectiveSchema,
      }).strict(),
      outputSchema: environmentDurableGoalOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_MINECRAFT_ACTION_MCP_SCOPES),
    },
    async (argumentsValue: HelixEnvironmentDurableGoalCreateToolArguments) =>
      callRoomObservationTool(HELIX_MINECRAFT_ACTION_MCP_SCOPES, async () => {
        requireAllAgentScopes(HELIX_MINECRAFT_ACTION_MCP_SCOPES);
        requireCurrentRoomFeature();
        const participantId = await resolveSelfParticipantId(argumentsValue.room_id);
        const goal = await durableGoalService.create({
          ownerProfileId: input.principal.accountProfileId,
          roomId: argumentsValue.room_id,
          participantId,
          environmentBindingId: argumentsValue.environment_binding_id,
          subjectNativeId: argumentsValue.subject_native_id,
          actionAuthorityId: argumentsValue.action_authority_id,
          runId: argumentsValue.run_id ?? null,
          turnId: argumentsValue.turn_id,
          objective: argumentsValue.objective,
        });
        return { ok: true, value: durableGoalMcpObservation(HELIX_ENVIRONMENT_DURABLE_GOAL_CREATE_CAPABILITY, argumentsValue.room_id, goal) };
      }),
  );

  server.registerTool(
    "helix_environment_goal_inspect",
    {
      title: "Inspect a durable environment goal",
      description:
        "Reconstructs bounded milestone, attempt, checkpoint, recovery, and evidence-reference context from the canonical goal ledger for the current authorized room participant.",
      inputSchema: z.object({
        room_id: helixSharedLiveRoomIdSchema,
        goal_id: z.string().trim().min(1).max(320),
      }).strict(),
      outputSchema: environmentDurableGoalOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_READ_SCOPE),
    },
    async ({ room_id, goal_id }: HelixEnvironmentDurableGoalInspectToolArguments) =>
      callRoomObservationTool(HELIX_SHARED_LIVE_ROOM_READ_SCOPE, async () => {
        requireHelixAgentApiScope(input.principal, HELIX_SHARED_LIVE_ROOM_READ_SCOPE);
        requireCurrentRoomFeature();
        const participantId = await resolveSelfParticipantId(room_id);
        const goal = await durableGoalService.inspect({
          goalId: goal_id,
          profileId: input.principal.accountProfileId,
          participantId,
        });
        return { ok: true, value: durableGoalMcpObservation(HELIX_ENVIRONMENT_DURABLE_GOAL_INSPECT_CAPABILITY, room_id, goal) };
      }),
  );

  server.registerTool(
    "helix_environment_goal_append",
    {
      title: "Append a durable environment-goal event",
      description:
        "Appends one revision-checked event after exact identity and evidence admission. Runtime Codex owns strategy and retry choices; this tool only records verified lifecycle facts and returns nonterminal context for re-entry.",
      inputSchema: helixEnvironmentDurableGoalAppendRequestSchema.extend({
        room_id: helixSharedLiveRoomIdSchema,
        environment_binding_id: z.string().trim().min(1).max(320),
        goal_id: z.string().trim().min(1).max(320),
      }).strict(),
      outputSchema: environmentDurableGoalOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_MINECRAFT_ACTION_MCP_SCOPES),
    },
    async (argumentsValue: HelixEnvironmentDurableGoalAppendToolArguments) =>
      callRoomObservationTool(HELIX_MINECRAFT_ACTION_MCP_SCOPES, async () => {
        requireAllAgentScopes(HELIX_MINECRAFT_ACTION_MCP_SCOPES);
        requireCurrentRoomFeature();
        const participantId = await resolveSelfParticipantId(argumentsValue.room_id);
        const goal = await durableGoalService.append({
          ownerProfileId: input.principal.accountProfileId,
          roomId: argumentsValue.room_id,
          participantId,
          environmentBindingId: argumentsValue.environment_binding_id,
          subjectNativeId: argumentsValue.subject_native_id,
          actionAuthorityId: argumentsValue.action_authority_id,
          runId: argumentsValue.run_id ?? null,
          turnId: argumentsValue.turn_id,
          goalId: argumentsValue.goal_id,
          expectedRevision: argumentsValue.expected_revision,
          payload: argumentsValue.payload,
          evidenceRefs: argumentsValue.evidence_refs,
        });
        return { ok: true, value: durableGoalMcpObservation(HELIX_ENVIRONMENT_DURABLE_GOAL_APPEND_CAPABILITY, argumentsValue.room_id, goal) };
      }),
  );

  server.registerTool(
    "helix_environment_goal_checkpoint_hash",
    {
      title: "Calculate a durable-goal checkpoint evidence hash",
      description:
        "Calculates the canonical deterministic hash for an exact proposed checkpoint payload. It does not admit evidence, append progress, or decide milestone or terminal eligibility; helix_environment_goal_append independently verifies the result.",
      inputSchema: z.object({
        evidence_refs: z.array(z.string().trim().min(1).max(320)).max(256),
        observation_revision: z.number().int().min(0),
        verified_facts: z.record(z.string(), z.unknown()),
        completed_postcondition_ids: z.array(z.string().trim().min(1).max(320)).max(128),
        incomplete_postcondition_ids: z.array(z.string().trim().min(1).max(320)).max(128),
      }).strict(),
      outputSchema: environmentGoalCheckpointHashOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_READ_SCOPE),
    },
    async (argumentsValue: HelixEnvironmentGoalCheckpointHashToolArguments) =>
      callRoomObservationTool(HELIX_SHARED_LIVE_ROOM_READ_SCOPE, async () => {
        requireHelixAgentApiScope(input.principal, HELIX_SHARED_LIVE_ROOM_READ_SCOPE);
        requireCurrentRoomFeature();
        return {
          ok: true,
          value: {
            operation: "environment.durable_goal.checkpoint_hash",
            checkpoint_evidence_hash: helixEnvironmentDurableGoalSha256({
              evidence_refs: argumentsValue.evidence_refs,
              observation_revision: argumentsValue.observation_revision,
              verified_facts: argumentsValue.verified_facts,
              completed_postcondition_ids: argumentsValue.completed_postcondition_ids,
              incomplete_postcondition_ids: argumentsValue.incomplete_postcondition_ids,
            }),
            content_role:
              "environment_checkpoint_hash_observation_not_assistant_answer",
            answer_authority: false,
            assistant_answer: false,
            terminal_eligible: false,
          },
        };
      }),
  );

  server.registerTool(
    "helix_environment_action_authority_extend",
    {
      title: "Extend an exact player-action authority lease",
      description:
        "Lets the authenticated room owner extend only the expiry of one exact active Player Embodiment authority and its existing connector credential. Capability policy, subject, participant, world, adapter, autonomy mode, and policy version remain unchanged; no credential is returned.",
      inputSchema: z.object({
        room_id: helixSharedLiveRoomIdSchema,
        environment_binding_id: z.string().trim().min(1).max(320),
        action_authority_id: z.string().trim().min(1).max(320),
        expires_at: z.string().datetime({ offset: true }).refine(
          (value) => {
            const delta = Date.parse(value) - Date.now();
            return delta >= 60_000 && delta <= 7 * 24 * 60 * 60_000;
          },
          "Lease expiry must be between one minute and seven days in the future.",
        ),
      }).strict(),
      outputSchema: environmentActionAuthorityExtendOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_MINECRAFT_ACTION_MCP_SCOPES),
    },
    async (argumentsValue: HelixEnvironmentActionAuthorityExtendToolArguments) =>
      callRoomObservationTool(HELIX_MINECRAFT_ACTION_MCP_SCOPES, async () => {
        requireAllAgentScopes(HELIX_MINECRAFT_ACTION_MCP_SCOPES);
        requireCurrentRoomFeature();
        const authority = await actionAuthorityLeaseExtender({
          roomId: argumentsValue.room_id,
          ownerProfileId: input.principal.accountProfileId,
          environmentBindingId: argumentsValue.environment_binding_id,
          actionAuthorityId: argumentsValue.action_authority_id,
          expiresAt: argumentsValue.expires_at,
        });
        return {
          ok: true,
          value: {
            operation: "environment.action_authority.extend",
            room_id: argumentsValue.room_id,
            authority,
            content_role:
              "environment_action_authority_receipt_not_assistant_answer",
            reentry_required: true,
            answer_authority: false,
            assistant_answer: false,
            terminal_eligible: false,
          },
        };
      }),
  );

  server.registerTool(
    "helix_minecraft_actor_status",
    {
      title: "Read the selected Minecraft actor status",
      description:
        "Requests one fresh, read-only actor-status observation through the authenticated room, selected player subject, active connector, and exact probe schema. The observation is evidence for Codex re-entry, never an assistant answer or terminal authority.",
      inputSchema: z
        .object({
          room_id: helixSharedLiveRoomIdSchema,
          environment_label: z.string().trim().min(1).max(240).optional(),
        })
        .strict(),
      outputSchema: minecraftActorStatusOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
      _meta: oauthToolMeta(HELIX_MINECRAFT_STATUS_MCP_SCOPES),
    },
    async ({
      room_id,
      environment_label,
    }: HelixMinecraftActorStatusToolArguments) =>
      callRoomObservationTool(HELIX_MINECRAFT_STATUS_MCP_SCOPES, async () => {
        requireAllAgentScopes(HELIX_MINECRAFT_STATUS_MCP_SCOPES);
        requireCurrentRoomFeature();
        const digest = crypto.randomUUID();
        const execution: EnvironmentProbeGatewayExecution =
          await environmentProbeExecutor({
            capabilityId: HELIX_MINECRAFT_ACTOR_STATUS_READ_CAPABILITY,
            turnId: `mcp_environment_probe_turn:${digest}`,
            toolCallId: `mcp_environment_probe_tool_call:${digest}`,
            providerExecutionId: `mcp_environment_probe_execution:${digest}`,
            arguments: environment_label ? { environment_label } : {},
            accountContext: input.principal.accountContext,
            conversationThreadId: `helix-ask:room:${room_id}`,
          });
        return {
          ok: execution.ok,
          value: {
            operation: "minecraft.actor.status.read",
            room_id,
            ok: execution.ok,
            status: execution.status,
            summary: execution.summary,
            observation: execution.observation,
            answer_authority: false,
            assistant_answer: false,
            terminal_eligible: false,
          },
        };
      }),
  );

  server.registerTool(
    "helix_environment_semantic_wake_read",
    {
      title: "Read Minecraft semantic wake evidence",
      description:
        "Returns compact G4 Minecraft semantic-change evidence for the authenticated participant's selected player in one exact room. It is nonterminal evidence for Codex replanning; it never performs a reflex, mutates the world, or supplies answer authority.",
      inputSchema: z
        .object({
          room_id: helixSharedLiveRoomIdSchema,
          source_id: z.string().trim().min(1).max(320).optional(),
          after_observation_revision: z.number().int().min(0).optional(),
          limit: z.number().int().min(1).max(20).default(10),
        })
        .strict(),
      outputSchema: environmentSemanticWakeReadOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_MINECRAFT_STATUS_MCP_SCOPES),
    },
    async ({
      room_id,
      source_id,
      after_observation_revision,
      limit,
    }: HelixEnvironmentSemanticWakeReadToolArguments) =>
      callRoomObservationTool(HELIX_MINECRAFT_STATUS_MCP_SCOPES, async () => {
        requireAllAgentScopes(HELIX_MINECRAFT_STATUS_MCP_SCOPES);
        requireCurrentRoomFeature();
        const participantId = await resolveSelfParticipantId(room_id);
        const nowMs = Date.now();
        const items = listStagePlayLiveSourceMailItems({
          threadId: `helix-ask:room:${room_id}`,
          roomId: room_id,
          sourceId: source_id ?? null,
          sourceKind: "minecraft_world_event",
          limit: 250,
        })
          .filter((item) => {
            const identity = item.environmentIdentity;
            return Boolean(
              identity &&
              identity.provenanceValid &&
              identity.participantId === participantId &&
              (after_observation_revision === undefined ||
                identity.observationRevision > after_observation_revision),
            );
          })
          .slice(-limit)
          .map((item) => {
            const identity = item.environmentIdentity!;
            let semanticEvidence: RecordLike = {};
            try {
              const parsed = JSON.parse(item.summary.text) as unknown;
              if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                semanticEvidence = parsed as RecordLike;
              }
            } catch {
              semanticEvidence = { summary: item.summary.preview };
            }
            const observedMs = Date.parse(item.createdAt);
            return {
              mail_id: item.mailId,
              source_id: item.sourceId,
              room_source_binding_id: identity.roomSourceBindingId,
              world_id: identity.worldId,
              producer_plane: identity.producerPlane,
              producer_epoch_ref: identity.producerEpochRef,
              subject_ref: identity.subjectRef,
              participant_id: participantId,
              selected_player_native_id: identity.selectedPlayerNativeId,
              observation_revision: identity.observationRevision,
              digest_id: identity.digestId,
              digest_hash: identity.digestHash,
              semantic_evidence: semanticEvidence,
              summary_preview: item.summary.preview,
              evidence_refs: Array.from(new Set([
                item.mailId,
                identity.digestId,
                identity.digestHash,
                ...item.evidenceRefs,
              ])),
              created_at: item.createdAt,
              freshness:
                Number.isFinite(observedMs) && nowMs - observedMs <= 120_000
                  ? "fresh"
                  : "stale",
            } as const;
          });
        return {
          ok: true,
          value: {
            operation: "environment.semantic_wake.read",
            room_id,
            items,
            content_role:
              "environment_semantic_wake_observation_not_assistant_answer",
            reentry_required: true,
            answer_authority: false,
            assistant_answer: false,
            terminal_eligible: false,
          },
        };
      }),
  );

  server.registerTool(
    "helix_minecraft_player_action",
    {
      title: "Execute a typed Minecraft player action",
      description:
        "Executes one bounded typed action or an admitted concurrent guardian program through the exact room, participant/player binding, Fabric action authority, live manifest, lease, resource locks, and manual-override policy. It does not accept raw server commands, shell, files, credentials, pairing material, or embedded model code. The returned observation must re-enter Codex before any answer is written.",
      inputSchema: z
        .object({
          room_id: helixSharedLiveRoomIdSchema,
          idempotency_key: idempotencyKeySchema,
          environment_label: z.string().trim().min(1).max(240).optional(),
          action: minecraftPlayerActionInputSchema,
        })
        .strict(),
      outputSchema: minecraftPlayerActionOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
      _meta: oauthToolMeta(HELIX_MINECRAFT_ACTION_MCP_SCOPES),
    },
    async ({
      room_id,
      idempotency_key,
      environment_label,
      action,
    }: HelixMinecraftPlayerActionToolArguments) =>
      callRoomObservationTool(HELIX_MINECRAFT_ACTION_MCP_SCOPES, async () => {
        requireAllAgentScopes(HELIX_MINECRAFT_ACTION_MCP_SCOPES);
        requireCurrentRoomFeature();
        const capabilityId = minecraftCapabilityIdForActionKind(
          action.action_kind,
        );
        if (!capabilityId) {
          throw new HelixAgentApiServiceError(
            400,
            "invalid_request",
            "The requested Minecraft player action is not registered.",
          );
        }
        const digest = minecraftMcpIdentityDigest({
          principal: input.principal,
          idempotencyKey: idempotency_key,
        });
        const actionArguments = normalizeMinecraftMcpActionArguments(action);
        const execution: EnvironmentActionGatewayExecution =
          await environmentActionExecutor({
            capabilityId,
            turnId: `mcp_environment_turn:${digest}`,
            toolCallId: `mcp_environment_tool_call:${digest}`,
            providerExecutionId: `mcp_environment_execution:${digest}`,
            arguments: {
              ...actionArguments,
              ...(environment_label ? { environment_label } : {}),
            },
            accountContext: input.principal.accountContext,
            conversationThreadId: `helix-ask:room:${room_id}`,
          });
        return {
          ok: execution.ok,
          value: {
            operation: "minecraft.player.action",
            room_id,
            ok: execution.ok,
            status: execution.status,
            summary: execution.summary,
            idempotency_replayed: execution.idempotentReplay ?? false,
            observation: execution.observation,
            answer_authority: false,
            assistant_answer: false,
            terminal_eligible: false,
          },
        };
      }),
  );

  server.registerTool(
    "helix_minecraft_workflow_status",
    {
      title: "Read a Minecraft player workflow status",
      description:
        "Reads one exact admitted workflow through its room/player authority. The result is a current non-terminal observation, not an assistant answer.",
      inputSchema: z
        .object({
          room_id: helixSharedLiveRoomIdSchema,
          workflow_ref: z.string().trim().min(1).max(320),
        })
        .strict(),
      outputSchema: minecraftWorkflowControlOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_MINECRAFT_STATUS_MCP_SCOPES),
    },
    async ({ room_id, workflow_ref }: HelixMinecraftWorkflowStatusToolArguments) =>
      callRoomObservationTool(HELIX_MINECRAFT_STATUS_MCP_SCOPES, async () => {
        requireAllAgentScopes(HELIX_MINECRAFT_STATUS_MCP_SCOPES);
        requireCurrentRoomFeature();
        const execution: EnvironmentActionControlGatewayExecution =
          await environmentActionControlExecutor({
            capabilityId: minecraftControlCapabilityId("status"),
            turnId: `mcp_environment_status_turn:${crypto.randomUUID()}`,
            arguments: { workflow_ref },
            accountContext: input.principal.accountContext,
            conversationThreadId: `helix-ask:room:${room_id}`,
          });
        return {
          ok: execution.ok,
          value: {
            operation: "minecraft.player.workflow.status",
            room_id,
            ok: execution.ok,
            status: execution.status,
            summary: execution.summary,
            observation: execution.observation,
            answer_authority: false,
            assistant_answer: false,
            terminal_eligible: false,
          },
        };
      }),
  );

  server.registerTool(
    "helix_minecraft_workflow_control",
    {
      title: "Control a Minecraft player workflow",
      description:
        "Resumes, cancels, or emergency-stops one exact admitted workflow. Cancellation and Emergency Stop require the Fabric client to release asserted controls; the returned receipt is evidence, never answer authority.",
      inputSchema: z
        .object({
          room_id: helixSharedLiveRoomIdSchema,
          workflow_ref: z.string().trim().min(1).max(320),
          control: z.enum(["resume", "cancel", "emergency_stop"]),
          reason: z.string().trim().min(1).max(1_000).optional(),
        })
        .strict(),
      outputSchema: minecraftWorkflowControlOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_MINECRAFT_ACTION_MCP_SCOPES),
    },
    async ({
      room_id,
      workflow_ref,
      control,
      reason,
    }: HelixMinecraftWorkflowControlToolArguments) =>
      callRoomObservationTool(HELIX_MINECRAFT_ACTION_MCP_SCOPES, async () => {
        requireAllAgentScopes(HELIX_MINECRAFT_ACTION_MCP_SCOPES);
        requireCurrentRoomFeature();
        const execution: EnvironmentActionControlGatewayExecution =
          await environmentActionControlExecutor({
            capabilityId: minecraftControlCapabilityId(control),
            turnId: `mcp_environment_control_turn:${crypto.randomUUID()}`,
            arguments: {
              workflow_ref,
              ...(reason ? { reason } : {}),
            },
            accountContext: input.principal.accountContext,
            conversationThreadId: `helix-ask:room:${room_id}`,
          });
        return {
          ok: execution.ok,
          value: {
            operation: "minecraft.player.workflow.control",
            room_id,
            ok: execution.ok,
            status: execution.status,
            summary: execution.summary,
            observation: execution.observation,
            answer_authority: false,
            assistant_answer: false,
            terminal_eligible: false,
          },
        };
      }),
  );

  server.registerTool(
    "helix_room_list",
    {
      title: "List Shared Live Rooms",
      description:
        "Lists only rooms visible to the verified linked Helix account. The receipt is an observation and never an assistant answer.",
      inputSchema: z.object({}).strict(),
      outputSchema: roomListOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_READ_SCOPE),
    },
    async () =>
      callRoomTool(HELIX_SHARED_LIVE_ROOM_READ_SCOPE, async () => {
        requireHelixAgentApiScope(
          input.principal,
          HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
        );
        return (await roomControlService.listRooms({
          actor: roomActor,
        })) as unknown as RecordLike;
      }),
  );

  server.registerTool(
    "helix_room_inspect",
    {
      title: "Inspect a Shared Live Room",
      description:
        "Inspects one opaque room ID after current account membership and policy checks.",
      inputSchema: z
        .object({
          room_id: helixSharedLiveRoomIdSchema,
        })
        .strict(),
      outputSchema: roomInspectOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_READ_SCOPE),
    },
    async ({ room_id }: HelixRoomIdToolArguments) =>
      callRoomTool(HELIX_SHARED_LIVE_ROOM_READ_SCOPE, async () => {
        requireHelixAgentApiScope(
          input.principal,
          HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
        );
        return (await roomControlService.inspectRoom({
          actor: roomActor,
          roomId: room_id,
        })) as unknown as RecordLike;
      }),
  );

  server.registerTool(
    "helix_room_create",
    {
      title: "Create a Shared Live Room",
      description:
        "Idempotently creates a room owned by the verified linked Helix account. Caller-provided identity fields are not accepted.",
      inputSchema: z
        .object({
          idempotency_key: idempotencyKeySchema,
          request: helixSharedLiveRoomCreateRequestSchema,
        })
        .strict(),
      outputSchema: roomCreateOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE),
    },
    async ({ idempotency_key, request }: HelixRoomCreateToolArguments) =>
      callRoomTool(HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE, async () => {
        requireHelixAgentApiScope(
          input.principal,
          HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
        );
        const result = await roomControlService.createRoom({
          actor: roomActor,
          idempotencyKey: idempotency_key,
          request,
        });
        return {
          operation: "room.create",
          idempotency_replayed: result.idempotencyReplayed,
          receipt: result.body,
        };
      }),
  );

  server.registerTool(
    "helix_room_presence_set",
    {
      title: "Set own Shared Live Room presence",
      description:
        "Marks only the verified linked account participant present or away in an existing room. It cannot change another participant, consent, environment authority, or terminal authority.",
      inputSchema: z
        .object({ request: helixSharedLiveRoomPresenceSetRequestSchema })
        .strict(),
      outputSchema: roomPresenceSetOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_MINECRAFT_ACTION_MCP_SCOPES),
    },
    async ({ request }: HelixRoomPresenceSetToolArguments) =>
      callRoomTool(HELIX_MINECRAFT_ACTION_MCP_SCOPES, async () => {
        requireAllAgentScopes(HELIX_MINECRAFT_ACTION_MCP_SCOPES);
        return (await roomControlService.setOwnPresence({
          actor: roomActor,
          request,
        })) as unknown as RecordLike;
      }),
  );

  server.registerTool(
    "helix_room_bind_run",
    {
      title: "Bind a durable agent run to a Shared Live Room",
      description:
        "Creates the exact owner-scoped run-to-room binding. A run cannot be rebound to a different room.",
      inputSchema: z
        .object({
          request: helixSharedLiveRoomRunBindingRequestSchema,
        })
        .strict(),
      outputSchema: roomRunBindOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_ROOM_RUN_ATTACHMENT_SCOPES),
    },
    async ({ request }: HelixRoomRunBindToolArguments) =>
      callRoomTool(HELIX_ROOM_RUN_ATTACHMENT_SCOPES, async () => {
        requireAllAgentScopes(HELIX_ROOM_RUN_ATTACHMENT_SCOPES);
        requireCurrentRoomFeature();
        const binding = await roomBindingStore.bindRunToRoom({
          owner: roomOwner,
          runId: request.run_id,
          roomId: request.room_id,
        });
        return projectSharedLiveRoomRunBindingReceipt(
          binding,
        ) as unknown as RecordLike;
      }),
  );

  server.registerTool(
    "helix_room_claim_chat_binding",
    {
      title: "Claim a browser-authorized chat binding",
      description:
        "Consumes one opaque browser-issued claim handle for the exact verified account and run. It never enumerates chat sessions or returns a chat ID.",
      inputSchema: z
        .object({
          request: helixSharedLiveRoomChatBindingClaimRequestSchema,
        })
        .strict(),
      outputSchema: roomChatBindingClaimOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_ROOM_RUN_ATTACHMENT_SCOPES),
    },
    async ({ request }: HelixRoomChatBindingClaimToolArguments) =>
      callRoomTool(HELIX_ROOM_RUN_ATTACHMENT_SCOPES, async () => {
        requireAllAgentScopes(HELIX_ROOM_RUN_ATTACHMENT_SCOPES);
        requireCurrentRoomFeature();
        const binding = await roomBindingStore.claimPendingChatBinding({
          owner: roomOwner,
          runId: request.run_id,
          claimHandle: request.claim_handle,
        });
        return projectSharedLiveRoomChatBindingClaimReceipt(
          binding,
        ) as unknown as RecordLike;
      }),
  );

  server.registerTool(
    "helix_room_unbind_run",
    {
      title: "Withdraw a run-to-room binding",
      description:
        "Revokes one exact owner-scoped run-to-room binding by opaque binding reference. Repeating the same withdrawal returns an already-revoked receipt.",
      inputSchema: helixSharedLiveRoomRunBindingRevokeRequestSchema,
      outputSchema: roomRunUnbindOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_ROOM_RUN_ATTACHMENT_SCOPES),
    },
    async ({ binding_ref }: HelixRoomRunUnbindToolArguments) =>
      callRoomTool(HELIX_ROOM_RUN_ATTACHMENT_SCOPES, async () => {
        requireAllAgentScopes(HELIX_ROOM_RUN_ATTACHMENT_SCOPES);
        const result = await roomBindingStore.revokeRunRoomBindingForOwner({
          owner: roomOwner,
          bindingRef: binding_ref,
        });
        return projectSharedLiveRoomRunUnbindReceipt(
          result,
        ) as unknown as RecordLike;
      }),
  );

  server.registerTool(
    "helix_room_unbind_chat",
    {
      title: "Withdraw a claimed run-to-chat binding",
      description:
        "Revokes one exact owner-scoped claimed run-to-chat binding by opaque binding reference. It never returns the chat ID or stored context.",
      inputSchema: helixSharedLiveRoomChatBindingRevokeRequestSchema,
      outputSchema: roomChatBindingUnbindOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_ROOM_RUN_ATTACHMENT_SCOPES),
    },
    async ({ binding_ref }: HelixRoomChatBindingUnbindToolArguments) =>
      callRoomTool(HELIX_ROOM_RUN_ATTACHMENT_SCOPES, async () => {
        requireAllAgentScopes(HELIX_ROOM_RUN_ATTACHMENT_SCOPES);
        const result =
          await roomBindingStore.revokeClaimedRunChatBindingForOwner({
            owner: roomOwner,
            bindingRef: binding_ref,
          });
        return projectSharedLiveRoomChatBindingUnbindReceipt(
          result,
        ) as unknown as RecordLike;
      }),
  );

  server.registerTool(
    "helix_room_command_request",
    {
      title: "Request a Shared Live Room command (disabled)",
      description:
        "Command execution is not enabled. This tool always returns command_execution_not_enabled and never accepts sensor credentials for actions.",
      inputSchema: z
        .object({
          room_id: helixSharedLiveRoomIdSchema,
          command: z.string().trim().min(1).max(2_048),
        })
        .strict(),
      outputSchema: helixSharedLiveRoomErrorSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE),
    },
    async ({
      room_id: _roomId,
      command: _command,
    }: HelixRoomCommandRequestToolArguments) =>
      callRoomTool(HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE, async () => {
        requireHelixAgentApiScope(
          input.principal,
          HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
        );
        requireCurrentRoomFeature();
        throw new SharedLiveRoomControlError(
          501,
          "command_execution_not_enabled",
          "Shared Live Room command execution is not enabled.",
          false,
          {
            execution_enabled: false,
            sensor_credentials_accepted: false,
          },
        );
      }),
  );

  server.registerTool(
    "helix_room_source_list",
    {
      title: "List room source bindings",
      description:
        "Lists bounded non-authoritative source-binding projections for a developer-owned room. Credentials are never included.",
      inputSchema: z
        .object({
          room_id: helixSharedLiveRoomIdSchema,
        })
        .strict(),
      outputSchema: roomSourceListOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE),
    },
    async ({ room_id }: HelixRoomIdToolArguments) =>
      callRoomTool(HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE, async () => {
        requireHelixAgentApiScope(
          input.principal,
          HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE,
        );
        return (await roomControlService.listSourceBindings({
          actor: roomActor,
          roomId: room_id,
        })) as unknown as RecordLike;
      }),
  );

  server.registerTool(
    "helix_room_source_create",
    {
      title: "Create a deferred room source binding",
      description:
        "Idempotently creates source identity and returns only an opaque short-lived secure-delivery handle. It never returns the source bearer or plugin configuration.",
      inputSchema: z
        .object({
          room_id: helixSharedLiveRoomIdSchema,
          idempotency_key: idempotencyKeySchema,
          request: helixSharedLiveRoomSourceCreateRequestSchema,
        })
        .strict(),
      outputSchema: roomSourceCreateOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE),
    },
    async ({
      room_id,
      idempotency_key,
      request,
    }: HelixRoomSourceCreateToolArguments) =>
      callRoomTool(HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE, async () => {
        requireHelixAgentApiScope(
          input.principal,
          HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE,
        );
        const result = await roomControlService.createSourceBinding({
          actor: roomActor,
          roomId: room_id,
          idempotencyKey: idempotency_key,
          request,
        });
        return {
          operation: "room.source.create",
          idempotency_replayed: result.idempotencyReplayed,
          receipt: result.body,
        };
      }),
  );

  installOAuthToolCatalogAugmentation(
    server,
    new Map<string, RequiredOAuthScopes>([
      ["helix_run_start", HELIX_AGENT_RUN_WRITE_SCOPE],
      ["helix_run_continue", HELIX_AGENT_RUN_WRITE_SCOPE],
      ["helix_run_cancel", HELIX_AGENT_RUN_WRITE_SCOPE],
      ["helix_run_inspect", HELIX_AGENT_RUN_READ_SCOPE],
      ["helix_run_fetch_evidence", HELIX_AGENT_RUN_READ_SCOPE],
      ["helix_run_list_events", HELIX_AGENT_RUN_READ_SCOPE],
      ["helix_environment_device_check", HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
      ["helix_environment_goal_create", HELIX_MINECRAFT_ACTION_MCP_SCOPES],
      ["helix_environment_goal_inspect", HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
      ["helix_environment_goal_append", HELIX_MINECRAFT_ACTION_MCP_SCOPES],
      ["helix_environment_goal_checkpoint_hash", HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
      ["helix_environment_action_authority_extend", HELIX_MINECRAFT_ACTION_MCP_SCOPES],
      ["helix_minecraft_actor_status", HELIX_MINECRAFT_STATUS_MCP_SCOPES],
      ["helix_environment_semantic_wake_read", HELIX_MINECRAFT_STATUS_MCP_SCOPES],
      ["helix_minecraft_player_action", HELIX_MINECRAFT_ACTION_MCP_SCOPES],
      ["helix_minecraft_workflow_status", HELIX_MINECRAFT_STATUS_MCP_SCOPES],
      ["helix_minecraft_workflow_control", HELIX_MINECRAFT_ACTION_MCP_SCOPES],
      ["helix_room_list", HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
      ["helix_room_inspect", HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
      ["helix_room_create", HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE],
      ["helix_room_bind_run", HELIX_ROOM_RUN_ATTACHMENT_SCOPES],
      ["helix_room_claim_chat_binding", HELIX_ROOM_RUN_ATTACHMENT_SCOPES],
      ["helix_room_unbind_run", HELIX_ROOM_RUN_ATTACHMENT_SCOPES],
      ["helix_room_unbind_chat", HELIX_ROOM_RUN_ATTACHMENT_SCOPES],
      ["helix_room_command_request", HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE],
      ["helix_room_source_list", HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE],
      ["helix_room_source_create", HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE],
    ]),
  );
  return server;
};
