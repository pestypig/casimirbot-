import crypto from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
  HELIX_DESKTOP_TUNNEL_TRANSITION_EXECUTE_SCOPE,
  HELIX_DESKTOP_TUNNEL_TRANSITION_REQUEST_SCOPE,
  desktopMcpTransitionExecuteInputSchema,
  desktopMcpTransitionRequestInputSchema,
  type DesktopMcpTransitionIdentity,
  type DesktopMcpTransitionTarget,
} from "@shared/desktop-mcp-tunnel-transition";
import {
  REALTIME_TEXTURE_PACK_HARNESS_ACTIONS,
  REALTIME_TEXTURE_PACK_VISUAL_DIRECTION_COMMANDS,
  parseRealtimeTexturePackVisualDirectionCommandArguments,
} from "@shared/realtime-texture-pack-harness";
import {
  HELIX_PUBLIC_UI_AGENT_CATALOG_SCHEMA,
  HELIX_PUBLIC_UI_SURFACE_CATALOG,
  type HelixPublicUiAuthorityState,
  type HelixPublicUiInteractionKind,
} from "@shared/helix-public-ui-affordance";
import { helixMcpEvidenceObservationSchema } from
  "@shared/contracts/helix-mcp-evidence-capability.v1";
import {
  computeHelixSharedLiveRoomMcpDelegationSealedInputSha256V1,
  type HelixSharedLiveRoomMcpDelegationReceiptV1,
} from "@shared/contracts/helix-shared-live-room-mcp-delegation.v1";
import { getHelixMcpEvidenceCapabilityDescriptor } from
  "@shared/helix-mcp-evidence-capability-registry";
import {
  HelixMcpEvidenceObservationStore,
  HelixMcpEvidenceObservationStoreError,
} from "../services/mcp-evidence/observation-store";
import { createPostgresHelixMcpEvidenceObservationStore } from
  "../services/mcp-evidence/postgres-observation-store";
import { realtimeTexturePackHarnessStore } from "../services/helix-ask/workstation-tool-gateway/realtime-texture-pack-harness-store";
import { inspectAttendedFalControlProjection } from "../services/realtime-texture-pack/attended-fal-runtime";
import {
  DesktopMcpTunnelTransitionError,
  type DesktopMcpTunnelTransitionStore,
} from "../services/local-supervisor/desktop-mcp-tunnel-transition-store";
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
  HELIX_SHARED_LIVE_ROOM_CONSENT_REVOKE_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_CONSENT_REVOKE_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_CONSENT_GRANT_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_CONSENT_GRANT_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_FLOOR_INSPECT_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_FLOOR_INSPECT_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_FLOOR_RELEASE_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_FLOOR_RELEASE_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_FLOOR_ACQUIRE_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_FLOOR_ACQUIRE_RECEIPT_SCHEMA,
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
  helixSharedLiveRoomConsentRevokeRequestSchema,
  helixSharedLiveRoomConsentGrantRequestSchema,
  helixSharedLiveRoomFloorAcquireRequestSchema,
  helixSharedLiveRoomFloorReleaseRequestSchema,
  helixSharedLiveRoomErrorSchema,
  helixSharedLiveRoomIdSchema,
  helixSharedLiveRoomPresenceSetRequestSchema,
  helixSharedLiveRoomRunBindingRequestSchema,
  helixSharedLiveRoomRunBindingRevokeRequestSchema,
  helixSharedLiveRoomSourceCreateRequestSchema,
  type HelixSharedLiveRoomChatBindingClaimRequest,
  type HelixSharedLiveRoomChatBindingRevokeRequest,
  type HelixSharedLiveRoomCreateRequest,
  type HelixSharedLiveRoomConsentRevokeRequest,
  type HelixSharedLiveRoomConsentGrantRequest,
  type HelixSharedLiveRoomFloorReleaseRequest,
  type HelixSharedLiveRoomFloorAcquireRequest,
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
  helixEnvironmentActionAuthoritySchema,
  helixEnvironmentActionAuthoritySettingsSchema,
  helixEnvironmentActionConnectorReadinessSchema,
  helixEnvironmentActionControlObservationSchema,
  helixEnvironmentActionObservationSchema,
  type HelixEnvironmentActionAuthority,
  type HelixEnvironmentActionConnectorReadiness,
} from "@shared/helix-environment-action";
import {
  helixEnvironmentCommandAuthoritySchema,
  helixEnvironmentCommandAuthoritySettingsSchema,
  helixEnvironmentCommandMemberGrantSchema,
} from "@shared/helix-environment-command";
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
  HELIX_ENVIRONMENT_MONITOR_EVENT_FAMILIES,
  HelixEnvironmentMonitorContractError,
  helixEnvironmentMonitorDeliverySchema,
  helixEnvironmentMonitorLeaseSchema,
  type HelixEnvironmentMonitorIdentity,
} from "@shared/helix-environment-monitor";
import {
  buildHelixClientAuthorizationReadiness,
  helixClientAuthorizationCapabilityProfileSchema,
  helixClientAuthorizationReadinessSchema,
} from "@shared/helix-client-authorization-readiness";
import {
  HELIX_ENVIRONMENT_REASONING_ROLE_ARBITRATE_CAPABILITY,
  HELIX_ENVIRONMENT_REASONING_ROLE_DISPOSITION_CAPABILITY,
  HELIX_ENVIRONMENT_REASONING_ROLE_INSPECT_CAPABILITY,
  HELIX_ENVIRONMENT_REASONING_ROLE_RECORD_CAPABILITY,
  helixEnvironmentReasoningRoleArbitrateRequestSchema,
  helixEnvironmentReasoningRoleDispositionRequestSchema,
  helixEnvironmentReasoningRoleRecordRequestSchema,
  helixEnvironmentReasoningRoleSha256,
  type HelixEnvironmentReasoningRolePayload,
  type HelixEnvironmentReasoningRoleProjection,
} from "@shared/helix-environment-reasoning-role";
import {
  HELIX_MINECRAFT_ACTOR_STATUS_READ_CAPABILITY,
  HELIX_MINECRAFT_HAZARDS_SCAN_CAPABILITY,
  HELIX_MINECRAFT_INVENTORY_CHECK_CAPABILITY,
  HELIX_MINECRAFT_LINE_OF_SIGHT_CHECK_CAPABILITY,
  HELIX_MINECRAFT_LOCAL_MAP_INSPECT_CAPABILITY,
  HELIX_MINECRAFT_NEARBY_ENTITIES_LIST_CAPABILITY,
  HELIX_MINECRAFT_PERCEPTION_SNAPSHOT_READ_CAPABILITY,
  HELIX_MINECRAFT_REACHABILITY_CHECK_CAPABILITY,
  HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY,
  helixEnvironmentProbeObservationSchema,
} from "@shared/helix-environment-connector";
import {
  HELIX_BROKERAGE_READ_GATEWAY_ERROR_SCHEMA,
  HELIX_ROBINHOOD_READ_CAPABILITY_IDS,
  HELIX_ROBINHOOD_READ_ONLY_UPSTREAM_TOOLS,
  helixBrokerageObservationSchema,
  helixBrokerageRoomBindingSchema,
  type HelixBrokerageRoomBinding,
} from "@shared/helix-brokerage-environment";
import {
  HELIX_BROKERAGE_MARKET_OBSERVER_PROCESS_SCOPE,
  helixBrokerageMarketObserverReceiptSchema,
  type HelixBrokerageMarketObserverReceipt,
} from "@shared/trading/brokerage-market-observer";
import {
  helixRoomEnvironmentSelfBindingRequestSchema,
  helixRoomEnvironmentsReceiptSchema,
  type HelixRoomEnvironmentProjection,
  type HelixRoomEnvironmentSubjectBinding,
} from "@shared/helix-environment-subject";
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
  HELIX_MINECRAFT_PLAYER_COMBAT_ATTACK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_COMBAT_GUARD_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_CRAFT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_CONSUME_CAPABILITY,
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
import type { SharedLiveRoomMcpDelegationVerifier } from
  "../services/shared-live-room-control/mcp-delegation-verifier";
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
import { buildHelixPublicUiAgentCatalog } from
  "../services/helix-ask/public-ui-capability-audit";
import { buildHelixMcpEvidenceObservation } from
  "../services/mcp-evidence/observation";
import {
  executeEnvironmentActionControlGatewayCapability,
  type EnvironmentActionControlGatewayExecution,
} from "../services/helix-ask/workstation-tool-gateway/environment-action-control";
import {
  executeEnvironmentProbeGatewayCapability,
  type EnvironmentProbeGatewayExecution,
} from "../services/helix-ask/workstation-tool-gateway/environment-probe";
import {
  executeBrokerageReadGatewayCapability,
  type BrokerageReadGatewayExecution,
} from "../services/helix-ask/workstation-tool-gateway/brokerage-read";
import {
  attachRobinhoodConnectionToPrivateRoom,
  RobinhoodConnectionError,
} from "../services/brokerage/robinhood-connection-store";
import {
  bootstrapBrokerageResidentObserver,
  type BrokerageResidentBootstrapResult,
} from
  "../services/environment-connectors/brokerage/brokerage-resident-bootstrap";
import { PaperTradingError } from
  "../services/trading/paper-trading-errors";
import {
  environmentDurableGoalStore,
  isEnvironmentDurableGoalError,
  type EnvironmentDurableGoalStore,
} from "../services/environment-connectors/goals";
import {
  EnvironmentMonitorStoreError,
  environmentMonitorStore,
  type EnvironmentMonitorStore,
} from "../services/environment-connectors/monitoring/environment-monitor-store";
import {
  environmentMonitorSemanticSource,
  type EnvironmentMonitorSemanticSource,
} from "../services/environment-connectors/monitoring/environment-monitor-semantic-source";
import {
  EnvironmentReasoningRoleError,
  environmentReasoningRoleStore,
  isEnvironmentReasoningRoleError,
  type EnvironmentReasoningRoleStore,
} from "../services/environment-connectors/reasoning-roles/environment-reasoning-role-store";
import {
  ConnectorBootstrapPairingError,
  createConnectorBootstrapPairing,
} from
  "../services/environment-connectors/pairing/bootstrap-service";
import {
  LocalPlayerPairingHandoffError,
  stageLocalMinecraftPlayerPairing,
} from
  "../services/environment-connectors/pairing/local-player-pairing-handoff";
import {
  resolveLocalMinecraftPairingEndpoint,
  stageLocalMinecraftServerPairing,
} from
  "../services/environment-connectors/pairing/local-server-pairing-handoff";
import {
  configureEnvironmentActionAuthority,
  extendEnvironmentActionAuthorityLease,
  isEnvironmentActionAuthorityError,
  readEnvironmentActionAuthorities,
  readEnvironmentActionConnectorReadiness,
} from "../services/environment-connectors/actions/authority-store";
import {
  configureEnvironmentCommandAuthority,
  isEnvironmentCommandAuthorityError,
} from "../services/environment-connectors/commands";
import {
  bindOwnRoomEnvironmentSubject,
  isRoomEnvironmentSubjectError,
  listRoomEnvironmentProjections,
} from "../services/environment-connectors/subjects";
import {
  enqueueStagePlayLiveSourceMailItem,
  listStagePlayLiveSourceMailItems,
} from
  "../services/stage-play/stage-play-live-source-mailbox-store";
import {
  runBrokerageMarketObserverCycle,
} from "../services/trading/brokerage-market-observer";
import {
  runRobinhoodReadAcceptance,
  type RobinhoodReadAcceptanceReceipt,
} from "../services/trading/robinhood-read-acceptance";
import {
  readRobinhoodLiveAcceptanceReadiness,
} from "../services/trading/live-acceptance-readiness";
import {
  helixLiveAcceptanceReadinessSchema,
  type HelixLiveAcceptanceReadiness,
} from "@shared/trading/live-acceptance-readiness";
import {
  brokerageMarketObserverSemanticSource,
  type BrokerageMarketObserverSemanticSource,
} from
  "../services/environment-connectors/monitoring/brokerage-market-observer-semantic-source";
import {
  helixLocalSupervisorLifecycleStateSchema,
  helixLocalSupervisorRelayTypeSchema,
  helixLocalSupervisorResourceClaimInputSchema,
} from "@shared/helix-local-supervisor-coordination";
import {
  HelixLocalSupervisorCoordinationError,
  type HelixLocalSupervisorCoordinationStore,
  type HelixLocalSupervisorVerifiedIdentity,
} from "../services/local-supervisor/local-supervisor-coordination";
import {
  readEnvironmentActionExecutionLeaseClaim,
  type EnvironmentActionExecutionLeaseClaim,
} from "../services/environment-connectors/actions/action-broker";
import {
  readLocalSupervisorEnvironmentIdentity,
  type LocalSupervisorEnvironmentIdentity,
} from
  "../services/environment-connectors/bindings/local-supervisor-identity-reader";

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
const HELIX_MINECRAFT_COMMAND_AUTHORITY_MCP_SCOPES = [
  HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE,
  HELIX_ENVIRONMENT_ACTION_WRITE_SCOPE,
] as const;
const HELIX_BROKERAGE_READ_MCP_SCOPES = [
  HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
  HELIX_ENVIRONMENT_ACTION_READ_SCOPE,
] as const;
const HELIX_BROKERAGE_ROOM_BIND_MCP_SCOPES = [
  HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
  HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
  HELIX_ENVIRONMENT_ACTION_READ_SCOPE,
] as const;
const HELIX_BROKERAGE_PAPER_OBSERVER_MCP_SCOPES = [
  HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
  HELIX_ENVIRONMENT_ACTION_READ_SCOPE,
  HELIX_BROKERAGE_MARKET_OBSERVER_PROCESS_SCOPE,
] as const;
const HELIX_BROKERAGE_RESIDENT_BOOTSTRAP_MCP_SCOPES = [
  HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
  HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
  HELIX_ENVIRONMENT_ACTION_READ_SCOPE,
  HELIX_AGENT_RUN_WRITE_SCOPE,
  HELIX_BROKERAGE_MARKET_OBSERVER_PROCESS_SCOPE,
] as const;
export const HELIX_LOCAL_SUPERVISOR_READ_MCP_SCOPES = [
  HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
] as const;
export const HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES = [
  HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
  HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
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

type HelixRoomConsentRevokeToolArguments = {
  idempotency_key: string;
  request: HelixSharedLiveRoomConsentRevokeRequest;
};

type HelixRoomConsentGrantToolArguments = {
  idempotency_key: string;
  request: HelixSharedLiveRoomConsentGrantRequest;
  delegation: HelixSharedLiveRoomMcpDelegationReceiptV1;
};

type HelixRoomFloorReleaseToolArguments = {
  request: HelixSharedLiveRoomFloorReleaseRequest;
};

type HelixRoomFloorAcquireToolArguments = {
  idempotency_key: string;
  request: HelixSharedLiveRoomFloorAcquireRequest;
  delegation: HelixSharedLiveRoomMcpDelegationReceiptV1;
};

type HelixEnvironmentDeviceCheckToolArguments = {
  room_id?: string;
};

type HelixEnvironmentSubjectListToolArguments = {
  room_id: string;
};

type HelixEnvironmentSubjectSelectToolArguments = {
  room_id: string;
  environment_binding_id: string;
  subject_ref: string;
};

type HelixMinecraftPlayerActionToolArguments = {
  room_id: string;
  idempotency_key: string;
  perception_semantic_fingerprint?: string;
  principal_turn_id?: string;
  environment_label?: string;
  action: RecordLike & { action_kind: string };
};

type HelixMinecraftActorStatusToolArguments = {
  room_id: string;
};

const HELIX_MINECRAFT_MCP_SITUATION_PROBE_KINDS = [
  "inventory",
  "nearby_entities",
  "hazards",
  "local_map",
  "spatial_region",
  "line_of_sight",
  "reachability",
  "perception_snapshot",
] as const;

type HelixMinecraftSituationProbeKind =
  (typeof HELIX_MINECRAFT_MCP_SITUATION_PROBE_KINDS)[number];

type HelixMinecraftSituationProbeToolArguments = {
  room_id: string;
  monitor?: {
    monitor_id: string;
    client_continuation_ref: string;
  };
  probe: {
    kind: HelixMinecraftSituationProbeKind;
    freshness_requirement_ms?: number;
    position?: { x: number; y: number; z: number };
    horizontal_radius?: number;
    vertical_radius?: number;
    purpose?:
      | "general"
      | "structure_planning"
      | "build_planning"
      | "structure_verification"
      | "fire_safety"
      | "landing_safety"
      | "movement_safety";
  };
};

type HelixEnvironmentSemanticWakeReadToolArguments = {
  room_id: string;
  source_id?: string;
  after_observation_revision?: number;
  limit: number;
};

type HelixEnvironmentMonitorCreateToolArguments = {
  room_id: string;
  goal_id: string;
  client_continuation_ref: string;
  event_families: Array<(typeof HELIX_ENVIRONMENT_MONITOR_EVENT_FAMILIES)[number]>;
  max_event_age_ms: number;
  wake_budget_total: number;
  expires_in_seconds: number;
};

type HelixEnvironmentMonitorAccessToolArguments = {
  monitor_id: string;
  client_continuation_ref: string;
};

type HelixEnvironmentMonitorReadToolArguments =
  HelixEnvironmentMonitorAccessToolArguments & {
    timeout_ms: number;
    limit: number;
  };

type HelixEnvironmentMonitorAcknowledgeToolArguments =
  HelixEnvironmentMonitorAccessToolArguments & { cursor: number };

type HelixEnvironmentMonitorSnapshotToolArguments =
  HelixEnvironmentMonitorAccessToolArguments & {
    snapshot_evidence_ref: string;
    observed_at: string;
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

type HelixEnvironmentReasoningRoleRecordToolArguments = {
  room_id: string;
  environment_binding_id: string;
  action_authority_id: string;
  subject_native_id: string;
  turn_id: string;
  goal_id: string;
  expected_goal_revision: number;
  expected_ledger_revision: number;
  observation_revision: number;
  input_evidence_refs: string[];
  payload: HelixEnvironmentReasoningRolePayload;
  expires_in_seconds: number;
};

type HelixEnvironmentReasoningRoleInspectToolArguments = {
  room_id: string;
  goal_id: string;
};

type HelixEnvironmentReasoningRoleDispositionToolArguments = {
  room_id: string;
  turn_id: string;
  goal_id: string;
  expected_ledger_revision: number;
  role_output_id: string;
  disposition: "adopted" | "revised" | "ignored" | "rejected";
  adopted_capability_id: string | null;
  adopted_capability_arguments: RecordLike | null;
  rationale_summary: string;
};

type HelixEnvironmentReasoningRoleArbitrateToolArguments = {
  room_id: string;
  environment_binding_id: string;
  action_authority_id: string;
  subject_native_id: string;
  turn_id: string;
  goal_id: string;
  expected_goal_revision: number;
  expected_ledger_revision: number;
  observation_revision: number;
  considered_role_output_ids: string[];
  selected_role_output_id: string | null;
  reason: string;
};

type HelixEnvironmentActionAuthorityExtendToolArguments = {
  room_id: string;
  environment_binding_id: string;
  action_authority_id: string;
  expires_at: string;
};

type HelixEnvironmentActionAuthorityInspectToolArguments = {
  room_id: string;
  environment_binding_id: string;
};

type HelixEnvironmentActionAuthorityConfigureToolArguments = {
  room_id: string;
  environment_binding_id: string;
  settings: z.infer<typeof helixEnvironmentActionAuthoritySettingsSchema>;
};

type HelixEnvironmentCommandAuthorityConfigureToolArguments = {
  room_id: string;
  environment_binding_id: string;
  settings: z.infer<typeof helixEnvironmentCommandAuthoritySettingsSchema>;
};

type HelixEnvironmentPlayerPairLocalToolArguments = {
  room_id: string;
  binding_id: string;
  action_authority_id: string;
  credential_ttl_ms: number;
  idempotency_key: string;
};

type HelixEnvironmentServerPairLocalToolArguments = {
  room_id: string;
  binding_id: string;
  credential_ttl_ms: number;
  idempotency_key: string;
};

type HelixEnvironmentSourcePairLocalToolArguments =
  HelixEnvironmentServerPairLocalToolArguments;

type HelixBrokerageReadToolArguments = {
  room_id: string;
  connection_id?: string;
  upstream_tool: (typeof HELIX_ROBINHOOD_READ_ONLY_UPSTREAM_TOOLS)[number];
  upstream_arguments?: RecordLike;
};

type HelixBrokerageReadAcceptanceToolArguments = {
  room_id: string;
  connection_id: string;
  quote_probe_symbol: string;
};

type HelixBrokerageRoomBindToolArguments = {
  room_id: string;
  connection_id: string;
  capability_ids?: Array<(typeof HELIX_ROBINHOOD_READ_CAPABILITY_IDS)[number]>;
};

type HelixBrokerageLiveAcceptanceReadinessToolArguments = {
  room_id: string;
  connection_id: string;
};

type HelixBrokeragePaperObserverToolArguments = {
  room_id: string;
  connection_id: string;
  paper_account_id: string;
  monitor_id: string;
  client_continuation_ref: string;
  observation_id: string;
  symbol: string;
};

type HelixBrokerageResidentBootstrapToolArguments = {
  room_id: string;
  connection_id: string;
  run_id: string;
  turn_id: string;
  starting_equity_cents: number;
};

export type HelixEnvironmentActionMcpExecutor =
  typeof executeEnvironmentActionGatewayCapability;
export type HelixEnvironmentActionControlMcpExecutor =
  typeof executeEnvironmentActionControlGatewayCapability;
export type HelixEnvironmentProbeMcpExecutor =
  typeof executeEnvironmentProbeGatewayCapability;
export type HelixBrokerageReadMcpExecutor =
  typeof executeBrokerageReadGatewayCapability;
export type HelixBrokerageReadAcceptanceRunner = (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  quoteProbeSymbol: string;
}) => Promise<RobinhoodReadAcceptanceReceipt>;
export type HelixBrokerageLiveAcceptanceReadinessReader = (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
}) => Promise<HelixLiveAcceptanceReadiness>;
export type HelixBrokerageRoomBinder = (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  capabilityIds?: string[];
}) => Promise<HelixBrokerageRoomBinding>;
export type HelixBrokerageMarketObserverMcpRunner =
  typeof runBrokerageMarketObserverCycle;
export type HelixBrokerageResidentBootstrapper = (input: {
  ownerProfileId: string;
  roomId: string;
  participantId: string;
  connectionId: string;
  runId: string;
  turnId: string;
  startingEquityCents: number;
}) => Promise<BrokerageResidentBootstrapResult>;
export type HelixBrokerageMarketObserverSemanticSourcePort = Pick<
  BrokerageMarketObserverSemanticSource,
  "deliver"
>;
export type HelixEnvironmentDurableGoalMcpStore = Pick<
  EnvironmentDurableGoalStore,
  "create" | "inspect" | "append"
>;
export type HelixEnvironmentReasoningRoleMcpStore = Pick<
  EnvironmentReasoningRoleStore,
  | "recordOutput"
  | "inspect"
  | "recordPrincipalDisposition"
  | "arbitrate"
  | "linkCompletedPrincipalExecution"
>;
export type HelixEnvironmentMonitorMcpStore = Pick<
  EnvironmentMonitorStore,
  | "create"
  | "inspect"
  | "readPendingDeliveries"
  | "findDeliveredEvidenceRefs"
  | "deliver"
  | "markRetentionGap"
  | "acknowledge"
  | "recordFreshSnapshot"
  | "revoke"
>;
export type HelixEnvironmentMonitorSemanticSourcePort = Pick<
  EnvironmentMonitorSemanticSource,
  "readOrWait"
>;
export type HelixEnvironmentActionAuthorityLeaseExtender =
  typeof extendEnvironmentActionAuthorityLease;
export type HelixEnvironmentActionAuthorityConfigurator =
  typeof configureEnvironmentActionAuthority;
export type HelixEnvironmentCommandAuthorityConfigurator =
  typeof configureEnvironmentCommandAuthority;
export type HelixEnvironmentActionAuthorityInspector = (input: {
  roomId: string;
  profileId: string;
  environmentBindingId: string;
}) => Promise<{
  authorities: HelixEnvironmentActionAuthority[];
  connectorReadiness: HelixEnvironmentActionConnectorReadiness[];
}>;
export type HelixEnvironmentPlayerPairLocalHandoff = (input: {
  roomId: string;
  ownerProfileId: string;
  bindingId: string;
  actionAuthorityId: string;
  credentialTtlMs: number;
  idempotencyKey: string;
}) => Promise<{
  pairing: RecordLike;
  status: "player_pairing_inbox_staged";
}>;

export type HelixEnvironmentServerPairLocalHandoff = (input: {
  roomId: string;
  ownerProfileId: string;
  bindingId: string;
  credentialTtlMs: number;
  idempotencyKey: string;
}) => Promise<{
  pairing: RecordLike;
  status: "server_pairing_inbox_staged";
}>;

export type HelixEnvironmentSourcePairLocalHandoff =
  HelixEnvironmentServerPairLocalHandoff;

export type HelixEnvironmentDeviceCheckServicePort = (input: {
  ownerProfileId: string;
  roomId?: string;
}) => Promise<HelixEnvironmentDeviceCheckList>;
export type HelixLocalSupervisorExecutionLeaseClaimReader = (input: {
  roomId: string;
  profileId: string;
  actionRequestId: string;
}) => Promise<EnvironmentActionExecutionLeaseClaim | null>;
export type HelixLocalSupervisorEnvironmentIdentityReader = (input: {
  roomId: string;
  profileId: string;
  participantId: string;
  environmentBindingId: string;
}) => Promise<LocalSupervisorEnvironmentIdentity | null>;

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
export const HELIX_LOCAL_SUPERVISOR_COORDINATION_MCP_PATH =
  "/mcp/local-supervisor-coordination";
export const HELIX_LOCAL_SUPERVISOR_COORDINATION_RESOURCE_METADATA_PATH =
  "/.well-known/oauth-protected-resource/mcp/local-supervisor-coordination";

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

const roomConsentRevokeReceiptOutputSchema = z
  .object({
    ...roomReceiptAuthorityFields,
    schema: z.literal(HELIX_SHARED_LIVE_ROOM_CONSENT_REVOKE_RECEIPT_SCHEMA),
    operation: z.literal(HELIX_SHARED_LIVE_ROOM_CONSENT_REVOKE_CAPABILITY),
    content_role: z.literal("room_control_receipt_not_assistant_answer"),
    room: jsonObjectSchema,
    changed_fields: z.array(z.string()),
    authority_delta: z.literal("reduced_only"),
  })
  .passthrough();

const roomConsentRevokeOutputSchema = z
  .object({
    operation: z.literal("room.consent.revoke"),
    idempotency_replayed: z.boolean(),
    receipt: roomConsentRevokeReceiptOutputSchema,
  })
  .strict();

const roomConsentGrantReceiptOutputSchema = z
  .object({
    ...roomReceiptAuthorityFields,
    schema: z.literal(HELIX_SHARED_LIVE_ROOM_CONSENT_GRANT_RECEIPT_SCHEMA),
    operation: z.literal(HELIX_SHARED_LIVE_ROOM_CONSENT_GRANT_CAPABILITY),
    content_role: z.literal("room_control_receipt_not_assistant_answer"),
    room: jsonObjectSchema,
    changed_fields: z.array(z.string()),
    delegation_ref: z.string(),
    authority_delta: z.literal("increased_bounded"),
  })
  .passthrough();

const roomConsentGrantSuccessOutputSchema = z.object({
  operation: z.literal("room.consent.grant"),
  idempotency_replayed: z.boolean(),
  receipt: roomConsentGrantReceiptOutputSchema,
}).strict();
const roomConsentGrantOutputSchema = roomConsentGrantSuccessOutputSchema
  .partial()
  .passthrough();

const roomFloorProjectionSchema = z
  .object({
    participant_id: z.string().nullable(),
    epoch: z.number().int().nonnegative(),
    acquired_at: z.string().nullable(),
    lease_expires_at: z.string().nullable(),
  })
  .strict();

const roomFloorInspectOutputSchema = z
  .object({
    ...roomReceiptAuthorityFields,
    schema: z.literal(HELIX_SHARED_LIVE_ROOM_FLOOR_INSPECT_RECEIPT_SCHEMA),
    operation: z.literal(HELIX_SHARED_LIVE_ROOM_FLOOR_INSPECT_CAPABILITY),
    content_role: z.literal("room_control_observation_not_assistant_answer"),
    room_id: z.string(),
    floor: roomFloorProjectionSchema.nullable(),
  })
  .strict();

const roomFloorReleaseOutputSchema = z
  .object({
    ...roomReceiptAuthorityFields,
    schema: z.literal(HELIX_SHARED_LIVE_ROOM_FLOOR_RELEASE_RECEIPT_SCHEMA),
    operation: z.literal(HELIX_SHARED_LIVE_ROOM_FLOOR_RELEASE_CAPABILITY),
    content_role: z.literal("room_control_receipt_not_assistant_answer"),
    room: jsonObjectSchema,
    released: z.boolean(),
    requested_floor_epoch: z.number().int().nonnegative(),
    floor: roomFloorProjectionSchema,
    authority_delta: z.literal("reduced_only"),
  })
  .passthrough();

const roomFloorAcquireReceiptOutputSchema = z
  .object({
    ...roomReceiptAuthorityFields,
    schema: z.literal(HELIX_SHARED_LIVE_ROOM_FLOOR_ACQUIRE_RECEIPT_SCHEMA),
    operation: z.literal(HELIX_SHARED_LIVE_ROOM_FLOOR_ACQUIRE_CAPABILITY),
    content_role: z.literal("room_control_receipt_not_assistant_answer"),
    room: jsonObjectSchema,
    granted: z.literal(true),
    floor: roomFloorProjectionSchema,
    delegation_ref: z.string(),
    authority_delta: z.literal("increased_bounded"),
  })
  .passthrough();

const roomFloorAcquireSuccessOutputSchema = z.object({
  operation: z.literal("room.floor.acquire"),
  idempotency_replayed: z.boolean(),
  receipt: roomFloorAcquireReceiptOutputSchema,
}).strict();
const roomFloorAcquireOutputSchema = roomFloorAcquireSuccessOutputSchema
  .partial()
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
    const flattenedTarget = { ...(target as RecordLike) };
    if (action.action_kind === "track_target") {
      // The canonical MCP action makes nearest-target selection explicit, while
      // the model-facing gateway schema treats it as a fixed invariant and
      // materializes it again before connector-protocol validation. Do not leak
      // the invariant into the flat gateway arguments as an unadmitted field.
      delete flattenedTarget.selection;
    }
    return { ...remaining, ...flattenedTarget };
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
    perception_snapshot_compatibility: z
      .object({
        mode: z.literal("actor_status_catalog_compatibility_v1"),
        catalog_refresh_required: z.literal(true),
        ok: z.boolean(),
        status: z.enum(["completed", "blocked", "failed"]),
        summary: z.string(),
        observation: helixEnvironmentProbeObservationSchema,
      })
      .strict(),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

const minecraftSituationProbeOutputSchema = z
  .object({
    operation: z.literal("minecraft.situation.probe"),
    probe_kind: z.enum(HELIX_MINECRAFT_MCP_SITUATION_PROBE_KINDS),
    room_id: helixSharedLiveRoomIdSchema,
    ok: z.boolean(),
    status: z.enum(["completed", "blocked", "failed"]),
    summary: z.string(),
    observation: helixEnvironmentProbeObservationSchema,
    monitor_projection: z.object({
      disposition: z.enum(["not_requested", "projected", "unchanged"]),
      monitor_id: z.string().trim().min(1).max(320).nullable(),
      evidence_ref: z.string().trim().min(1).max(320).nullable(),
    }).strict(),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

const brokerageReadErrorObservationSchema = z.object({
  schema: z.literal(HELIX_BROKERAGE_READ_GATEWAY_ERROR_SCHEMA),
  ok: z.literal(false),
  environment_domain: z.literal("brokerage"),
  provider: z.literal("robinhood"),
  error: z.string(),
  summary: z.string(),
  retryable: z.boolean(),
  credential_included: z.literal(false),
  account_numbers_included: z.literal(false),
  raw_provider_payload_included: z.literal(false),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
  raw_content_included: z.literal(false),
}).strict();

const brokerageReadOutputSchema = z.object({
  operation: z.literal("brokerage.robinhood.read"),
  room_id: helixSharedLiveRoomIdSchema,
  source_binding_id: z.string().trim().min(1).max(320).nullable(),
  ok: z.boolean(),
  status: z.enum(["completed", "blocked", "failed"]),
  summary: z.string(),
  observation: z.union([
    helixBrokerageObservationSchema,
    brokerageReadErrorObservationSchema,
  ]),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict();

const brokerageReadAcceptanceReceiptSchema = z.object({
  schema: z.literal("helix.robinhood_read_acceptance.v1"),
  ok: z.literal(true),
  connection_id: z.string().trim().min(1).max(320),
  room_id: helixSharedLiveRoomIdSchema,
  quote_probe_symbol: z.string().trim().min(1).max(10),
  account_selection_status: z.literal("agentic_selected"),
  receipts: z.array(z.object({
    upstream_tool: z.enum(HELIX_ROBINHOOD_READ_ONLY_UPSTREAM_TOOLS),
    observation_id: z.string().trim().min(1).max(320),
    output_hash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
    observed_at: z.string().datetime({ offset: true }),
  }).strict()).length(5),
  provider_order_tool_calls_made: z.literal(0),
  live_order_execution_enabled: z.literal(false),
  credential_included: z.literal(false),
  account_numbers_included: z.literal(false),
  raw_provider_payload_included: z.literal(false),
}).strict();

const brokerageReadAcceptanceOutputSchema = z.object({
  operation: z.literal("brokerage.robinhood.read_acceptance"),
  receipt: brokerageReadAcceptanceReceiptSchema,
  content_role: z.literal(
    "brokerage_read_acceptance_receipt_not_assistant_answer",
  ),
  reentry_required: z.literal(true),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict();

const brokerageLiveAcceptanceReadinessOutputSchema = z.object({
  operation: z.literal("brokerage.robinhood.live_acceptance_readiness"),
  readiness: helixLiveAcceptanceReadinessSchema,
  content_role: z.literal(
    "brokerage_live_acceptance_readiness_not_assistant_answer",
  ),
  reentry_required: z.literal(true),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict();

const brokerageRoomBindOutputSchema = z.object({
  operation: z.literal("brokerage.robinhood.room_bind"),
  binding: helixBrokerageRoomBindingSchema,
  credential_included: z.literal(false),
  provider_mutation_attempted: z.literal(false),
  live_order_execution_enabled: z.literal(false),
  content_role: z.literal(
    "brokerage_room_binding_receipt_not_assistant_answer",
  ),
  reentry_required: z.literal(true),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict();

const brokeragePaperObserverOutputSchema = z.object({
  operation: z.literal("brokerage.paper_observer.process"),
  room_id: helixSharedLiveRoomIdSchema,
  receipt: helixBrokerageMarketObserverReceiptSchema,
  monitor_projection: z.object({
    disposition: z.enum(["no_material_change", "delivered", "duplicate"]),
    delivery: helixEnvironmentMonitorDeliverySchema.nullable(),
    duplicate_evidence_refs: z.array(z.string().trim().min(1).max(320)),
  }).strict(),
  credential_included: z.literal(false),
  provider_mutation_attempted: z.literal(false),
  live_order_execution_enabled: z.literal(false),
  content_role: z.literal(
    "brokerage_paper_observer_receipt_not_assistant_answer",
  ),
  reentry_required: z.literal(true),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict();

const brokerageResidentBootstrapOutputSchema = z.object({
  operation: z.literal("brokerage.resident_observer.bootstrap"),
  room_id: helixSharedLiveRoomIdSchema,
  idempotency_replayed: z.boolean(),
  paper_account: jsonObjectSchema,
  goal: jsonObjectSchema,
  credential_included: z.literal(false),
  provider_mutation_attempted: z.literal(false),
  live_order_execution_enabled: z.literal(false),
  content_role: z.literal(
    "brokerage_resident_bootstrap_receipt_not_assistant_answer",
  ),
  reentry_required: z.literal(true),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict();

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

const environmentMonitorLeaseOutputSchema = z.object({
  operation: z.enum([
    "environment.monitor.create",
    "environment.monitor.inspect",
    "environment.monitor.acknowledge",
    "environment.monitor.snapshot_record",
    "environment.monitor.revoke",
  ]),
  lease: helixEnvironmentMonitorLeaseSchema,
  credential_included: z.literal(false),
  raw_events_included: z.literal(false),
  content_role: z.literal("environment_monitor_control_not_assistant_answer"),
  reentry_required: z.literal(true),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict();

const environmentMonitorReadOutputSchema = z.object({
  operation: z.literal("environment.monitor.read"),
  lease: helixEnvironmentMonitorLeaseSchema,
  delivery: helixEnvironmentMonitorDeliverySchema,
  credential_included: z.literal(false),
  raw_events_included: z.literal(false),
  content_role: z.literal("environment_monitor_delivery_not_assistant_answer"),
  reentry_required: z.literal(true),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict();

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

const environmentReasoningRoleOutputSchema = z
  .object({
    operation: z.enum([
      HELIX_ENVIRONMENT_REASONING_ROLE_RECORD_CAPABILITY,
      HELIX_ENVIRONMENT_REASONING_ROLE_INSPECT_CAPABILITY,
      HELIX_ENVIRONMENT_REASONING_ROLE_DISPOSITION_CAPABILITY,
      HELIX_ENVIRONMENT_REASONING_ROLE_ARBITRATE_CAPABILITY,
    ]),
    room_id: helixSharedLiveRoomIdSchema,
    ok: z.literal(true),
    projection: jsonObjectSchema.nullable(),
    content_role: z.literal(
      "environment_reasoning_role_observation_not_assistant_answer",
    ),
    reentry_required: z.literal(true),
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

const environmentActionAuthorityConfigureOutputSchema = z
  .object({
    operation: z.literal("environment.action_authority.configure"),
    room_id: helixSharedLiveRoomIdSchema,
    authority: helixEnvironmentActionAuthoritySchema,
    content_role: z.literal(
      "environment_action_authority_receipt_not_assistant_answer",
    ),
    reentry_required: z.literal(true),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

const environmentCommandAuthorityConfigureOutputSchema = z
  .object({
    operation: z.literal("environment.command_authority.configure"),
    room_id: helixSharedLiveRoomIdSchema,
    authority: helixEnvironmentCommandAuthoritySchema,
    member_grant: helixEnvironmentCommandMemberGrantSchema,
    content_role: z.literal(
      "environment_command_authority_receipt_not_assistant_answer",
    ),
    reentry_required: z.literal(true),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

const environmentActionAuthorityInspectOutputSchema = z
  .object({
    operation: z.literal("environment.action_authority.inspect"),
    room_id: helixSharedLiveRoomIdSchema,
    environment_binding_id: z.string().trim().min(1).max(320),
    authorities: z.array(helixEnvironmentActionAuthoritySchema),
    connector_readiness: z.array(
      helixEnvironmentActionConnectorReadinessSchema,
    ),
    content_role: z.literal(
      "environment_action_authority_observation_not_assistant_answer",
    ),
    reentry_required: z.literal(true),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

const environmentPlayerPairLocalOutputSchema = z
  .object({
    operation: z.literal("environment.player_pair.local_handoff"),
    room_id: helixSharedLiveRoomIdSchema,
    action_authority_id: z.string().trim().min(1).max(320),
    pairing: jsonObjectSchema,
    handoff_status: z.literal("player_pairing_inbox_staged"),
    credential_included: z.literal(false),
    pairing_code_included: z.literal(false),
    content_role: z.literal(
      "environment_player_pairing_handoff_receipt_not_assistant_answer",
    ),
    reentry_required: z.literal(true),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

const environmentServerPairLocalOutputSchema = z
  .object({
    operation: z.literal("environment.server_pair.local_handoff"),
    room_id: helixSharedLiveRoomIdSchema,
    binding_id: z.string().trim().min(1).max(320),
    pairing: jsonObjectSchema,
    handoff_status: z.literal("server_pairing_inbox_staged"),
    credential_included: z.literal(false),
    pairing_code_included: z.literal(false),
    content_role: z.literal(
      "environment_server_pairing_handoff_receipt_not_assistant_answer",
    ),
    reentry_required: z.literal(true),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

const environmentSourcePairLocalOutputSchema = z
  .object({
    operation: z.literal("environment.source_pair.local_handoff"),
    room_id: helixSharedLiveRoomIdSchema,
    binding_id: z.string().trim().min(1).max(320),
    pairing: jsonObjectSchema,
    handoff_status: z.literal("server_pairing_inbox_staged"),
    credential_included: z.literal(false),
    pairing_code_included: z.literal(false),
    command_authority_granted: z.literal(false),
    player_embodiment_granted: z.literal(false),
    content_role: z.literal(
      "environment_source_pairing_handoff_receipt_not_assistant_answer",
    ),
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

const reasoningRoleMcpObservation = (
  operation:
    | typeof HELIX_ENVIRONMENT_REASONING_ROLE_RECORD_CAPABILITY
    | typeof HELIX_ENVIRONMENT_REASONING_ROLE_INSPECT_CAPABILITY
    | typeof HELIX_ENVIRONMENT_REASONING_ROLE_DISPOSITION_CAPABILITY
    | typeof HELIX_ENVIRONMENT_REASONING_ROLE_ARBITRATE_CAPABILITY,
  roomId: string,
  projection: HelixEnvironmentReasoningRoleProjection | null,
): RecordLike => ({
  operation,
  room_id: roomId,
  ok: true,
  projection,
  content_role: "environment_reasoning_role_observation_not_assistant_answer",
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
    case "attack": return HELIX_MINECRAFT_PLAYER_COMBAT_ATTACK_CAPABILITY;
    case "combat_guard": return HELIX_MINECRAFT_PLAYER_COMBAT_GUARD_CAPABILITY;
    case "hotbar_select": return HELIX_MINECRAFT_PLAYER_HOTBAR_SELECT_CAPABILITY;
    case "equip": return HELIX_MINECRAFT_PLAYER_EQUIP_CAPABILITY;
    case "follow": return HELIX_MINECRAFT_PLAYER_FOLLOW_CAPABILITY;
    case "collect": return HELIX_MINECRAFT_PLAYER_COLLECT_CAPABILITY;
    case "mine": return HELIX_MINECRAFT_PLAYER_MINE_CAPABILITY;
    case "place": return HELIX_MINECRAFT_PLAYER_PLACE_CAPABILITY;
    case "craft": return HELIX_MINECRAFT_PLAYER_CRAFT_CAPABILITY;
    case "consume": return HELIX_MINECRAFT_PLAYER_CONSUME_CAPABILITY;
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
  if (
    error instanceof RobinhoodConnectionError ||
    error instanceof PaperTradingError
  ) {
    const statusCode = error instanceof RobinhoodConnectionError
      ? error.statusCode
      : error.status;
    const value = {
      schema: "helix.brokerage_environment_error.v1",
      error: error.code,
      message: error.message,
      retryable: statusCode >= 500,
      credential_included: false,
      account_numbers_included: false,
      raw_provider_payload_included: false,
      content_role: "brokerage_environment_error_not_assistant_answer",
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
    error instanceof ConnectorBootstrapPairingError ||
    error instanceof LocalPlayerPairingHandoffError
  ) {
    const value = {
      schema: "helix.environment_connector_pairing_error.v1",
      error: error.code,
      message: error.message,
      retryable:
        error instanceof ConnectorBootstrapPairingError
          ? error.statusCode >= 500
          : false,
      credential_included: false,
      pairing_code_included: false,
      content_role:
        "environment_connector_pairing_error_not_assistant_answer",
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
  if (isEnvironmentActionAuthorityError(error)) {
    const value = {
      schema: "helix.environment_action_authority_error.v1",
      error: error.code,
      message: error.message,
      retryable: error.statusCode >= 500,
      credential_included: false,
      content_role:
        "environment_action_authority_error_not_assistant_answer",
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
  if (isEnvironmentCommandAuthorityError(error)) {
    const value = {
      schema: "helix.environment_command_authority_error.v1",
      error: error.code,
      message: error.message,
      retryable: error.statusCode >= 500,
      credential_included: false,
      content_role:
        "environment_command_authority_error_not_assistant_answer",
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
    error instanceof EnvironmentMonitorStoreError ||
    error instanceof HelixEnvironmentMonitorContractError
  ) {
    const value = {
      schema: "helix.environment_monitor_error.v1",
      error: error.code,
      message: error.message,
      retryable:
        error instanceof EnvironmentMonitorStoreError
          ? error.statusCode >= 500
          : false,
      details:
        error instanceof EnvironmentMonitorStoreError ? error.details : [],
      credential_included: false,
      raw_events_included: false,
      content_role: "environment_monitor_error_not_assistant_answer",
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
  if (isRoomEnvironmentSubjectError(error)) {
    const value = {
      schema: "helix.environment_subject_error.v1",
      error: error.code,
      message: error.message,
      retryable: error.statusCode >= 500,
      content_role: "environment_subject_error_not_assistant_answer",
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
  if (isEnvironmentReasoningRoleError(error)) {
    const value = {
      schema: "helix.environment_reasoning_role_error.v1",
      error: error.code,
      message: error.message,
      retryable: error.statusCode >= 500,
      details: error.details,
      content_role:
        "environment_reasoning_role_error_not_assistant_answer",
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

const publicUiSurfaceIds = new Set(
  HELIX_PUBLIC_UI_SURFACE_CATALOG.map((surface) => surface.surface_id),
);

const publicUiCatalogQuerySchema = z.object({
  surface_id: z.string().trim().min(1).max(160)
    .refine((value) => publicUiSurfaceIds.has(value), "Unknown public UI surface.")
    .optional(),
  interaction_kind: z.enum(["observe", "navigate", "configure", "act", "human_only"])
    .optional(),
  authority_state: z.enum([
    "shared_gateway",
    "route_owned",
    "client_local",
    "blocked_pending_contract",
    "not_applicable",
  ]).optional(),
  include_capabilities: z.boolean().default(true),
  include_mcp_bindings: z.boolean().default(true),
}).strict();

const requireMcpEvidenceDescriptor = (toolName: string) => {
  const descriptor = getHelixMcpEvidenceCapabilityDescriptor(toolName);
  if (!descriptor) {
    throw new Error(`mcp_evidence_capability_descriptor_missing:${toolName}`);
  }
  return descriptor;
};

const registerPublicUiCatalogTool = (input: {
  server: McpServer;
  principal: HelixAgentApiPrincipal;
  requiredScope: string;
  resourceMetadataPath?: string;
  evidenceStore: Pick<HelixMcpEvidenceObservationStore, "put">;
}): void => {
  input.server.registerTool(
    "helix_public_ui_catalog",
    {
      title: "Inspect the public Helix UI catalog",
      description: "Returns the public-user UI surfaces, stable control IDs, interaction classifications, policy-audited capability projections, and governed MCP bindings. It never controls the DOM, grants authority, exposes handlers, or returns private UI state.",
      inputSchema: publicUiCatalogQuerySchema,
      outputSchema: z.object({
        mcp_evidence: helixMcpEvidenceObservationSchema,
      }).passthrough(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(input.requiredScope),
    },
    async (query) => callTool(input.requiredScope, async () => {
      requireHelixAgentApiScope(input.principal, input.requiredScope);
      const catalog = buildHelixPublicUiAgentCatalog();
      const controls = catalog.controls.filter((control) =>
        (!query.surface_id || control.surface_id === query.surface_id) &&
        (!query.interaction_kind || control.interaction_kind === query.interaction_kind) &&
        (!query.authority_state || control.authority_state === query.authority_state),
      );
      const capabilities = query.include_capabilities
        ? catalog.capabilities.filter((capability) =>
            (!query.surface_id || capability.projection_surface_id === query.surface_id) &&
            (!query.interaction_kind || capability.interaction_kind === query.interaction_kind) &&
            (!query.authority_state || capability.authority_state === query.authority_state),
          )
        : [];
      const mcpBindings = query.include_mcp_bindings
        ? catalog.mcp_bindings.filter((binding) =>
            (!query.surface_id || binding.projection_surface_id === query.surface_id) &&
            (!query.interaction_kind || binding.interaction_kind === query.interaction_kind) &&
            (!query.authority_state || binding.authority_state === query.authority_state),
          )
        : [];
      const payload = {
        ...catalog,
        surfaces: query.surface_id
          ? catalog.surfaces.filter((surface) => surface.surface_id === query.surface_id)
          : catalog.surfaces,
        controls,
        capabilities,
        mcp_bindings: mcpBindings,
        query: {
          surface_id: query.surface_id ?? null,
          interaction_kind: (query.interaction_kind ?? null) as HelixPublicUiInteractionKind | null,
          authority_state: (query.authority_state ?? null) as Exclude<HelixPublicUiAuthorityState, "unmapped"> | null,
          include_capabilities: query.include_capabilities,
          include_mcp_bindings: query.include_mcp_bindings,
        },
        totals: {
          public_surface_count: catalog.surfaces.length,
          public_control_count: catalog.controls.length,
          public_capability_count: catalog.capabilities.length,
          public_mcp_binding_count: catalog.mcp_bindings.length,
          matched_surface_count: query.surface_id ? 1 : catalog.surfaces.length,
          matched_control_count: controls.length,
          matched_capability_count: capabilities.length,
          matched_mcp_binding_count: mcpBindings.length,
        },
      };
      const mcpEvidence = buildHelixMcpEvidenceObservation({
        descriptor: requireMcpEvidenceDescriptor("helix_public_ui_catalog"),
        request: {
          surface_id: query.surface_id ?? null,
          interaction_kind: query.interaction_kind ?? null,
          authority_state: query.authority_state ?? null,
          include_capabilities: query.include_capabilities,
          include_mcp_bindings: query.include_mcp_bindings,
        },
        payload,
        producerRef: `casimirbot-profile:${input.principal.accountProfileId}`,
        subjectRefs: [`account-profile:${input.principal.accountProfileId}`],
        summary: "Observed the bounded public-user UI catalog and semantic capability projection.",
        payloadSchema: HELIX_PUBLIC_UI_AGENT_CATALOG_SCHEMA,
        supportRefs: [
          HELIX_PUBLIC_UI_AGENT_CATALOG_SCHEMA,
          ...capabilities.map((capability) => capability.capability_id),
          ...mcpBindings.map((binding) => binding.tool_name),
        ],
      });
      await input.evidenceStore.put({
        owner: {
          tenantId: input.principal.tenantId,
          accountProfileId: input.principal.accountProfileId,
        },
        toolName: "helix_public_ui_catalog",
        observation: mcpEvidence,
      });
      return {
        ...payload,
        mcp_evidence: mcpEvidence,
      };
    }, input.resourceMetadataPath),
  );
};

const registerEnvironmentDeviceCheckTool = (input: {
  server: McpServer;
  principal: HelixAgentApiPrincipal;
  deviceCheckService: HelixEnvironmentDeviceCheckServicePort;
  resourceMetadataPath?: string;
  evidenceStore: Pick<HelixMcpEvidenceObservationStore, "put">;
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
      outputSchema: helixEnvironmentDeviceCheckListSchema.extend({
        mcp_evidence: helixMcpEvidenceObservationSchema,
      }),
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
          try {
            requireHelixAgentApiScope(
              input.principal,
              HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
            );
            // Device Check is an owner-scoped health observation, not admission
            // to create, join, source, or mutate a Shared Live Room. Keep those
            // room operations behind their existing feature gate while allowing
            // a scoped user account to inspect only its own connector devices.
            const payload = await input.deviceCheckService({
              ownerProfileId: input.principal.accountProfileId,
              roomId: room_id,
            });
            const mcpEvidence = buildHelixMcpEvidenceObservation({
              descriptor: requireMcpEvidenceDescriptor("helix_environment_device_check"),
              request: { room_id: room_id ?? null },
              payload,
              producerRef: `casimirbot-profile:${input.principal.accountProfileId}`,
              subjectRefs: [
                `account-profile:${input.principal.accountProfileId}`,
                ...(room_id ? [room_id] : []),
              ],
              summary: "Observed owner-scoped environment connector identity, freshness, and probe readiness.",
              payloadSchema: payload.schema,
              supportRefs: payload.devices.map((device) => `environment-device:${device.device_id}`),
              observedAt: payload.generated_at,
              freshness: {
                state: "fresh",
                ageMs: 0,
                expiresAt: null,
              },
            });
            await input.evidenceStore.put({
              owner: {
                tenantId: input.principal.tenantId,
                accountProfileId: input.principal.accountProfileId,
              },
              toolName: "helix_environment_device_check",
              observation: mcpEvidence,
            });
            return {
              ...payload,
              mcp_evidence: mcpEvidence,
            };
          } catch (error) {
            console.error("[helix-mcp] unexpected Device Check tool error", {
              name: error instanceof Error ? error.name : typeof error,
              message: error instanceof Error ? error.message : "non_error_value",
            });
            throw error;
          }
        },
        input.resourceMetadataPath,
      ),
  );
};

type HelixMcpEvidenceObservationStorePort = Pick<
  HelixMcpEvidenceObservationStore,
  "put" | "get"
>;

const registerMcpEvidenceObservationGetTool = (input: {
  server: McpServer;
  principal: HelixAgentApiPrincipal;
  requiredScope: RequiredOAuthScopes;
  evidenceStore: HelixMcpEvidenceObservationStorePort;
  resourceMetadataPath?: string;
}): void => {
  input.server.registerTool(
    "helix_evidence_observation_get",
    {
      title: "Retrieve an MCP evidence observation",
      description:
        "Retrieves one still-valid owner-scoped evidence envelope for Codex re-entry. Retrieval does not refresh, execute, answer, or grant terminal authority.",
      inputSchema: z.object({
        observation_ref: z.string().trim().min(1).max(320),
      }).strict(),
      outputSchema: z.object({
        schema: z.literal("helix.mcp_evidence_retrieval.v1"),
        requested_observation_ref: z.string(),
        observation: helixMcpEvidenceObservationSchema,
        content_role: z.literal("retrieved_observation_for_codex_reentry"),
        assistant_answer: z.literal(false),
        agent_executable: z.literal(false),
        terminal_eligible: z.literal(false),
        reentry_required: z.literal(true),
        mcp_evidence: helixMcpEvidenceObservationSchema,
      }).strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(input.requiredScope),
    },
    async ({ observation_ref }) => callTool(
      input.requiredScope,
      async () => {
        requireHelixAgentApiScope(input.principal, input.requiredScope);
        let observation;
        try {
          observation = await input.evidenceStore.get({
            owner: {
              tenantId: input.principal.tenantId,
              accountProfileId: input.principal.accountProfileId,
            },
            observationRef: observation_ref,
          });
        } catch (error) {
          if (!(error instanceof HelixMcpEvidenceObservationStoreError)) throw error;
          const status = error.code === "observation_owner_mismatch" ? 403
            : error.code === "observation_not_found" ? 404
            : error.code === "observation_corrupt" ? 500
            : 410;
          throw new HelixAgentApiServiceError(
            status,
            error.code,
            error.message,
            false,
          );
        }
        const payload = {
          schema: "helix.mcp_evidence_retrieval.v1" as const,
          requested_observation_ref: observation_ref,
          observation,
          content_role: "retrieved_observation_for_codex_reentry" as const,
          assistant_answer: false as const,
          agent_executable: false as const,
          terminal_eligible: false as const,
          reentry_required: true as const,
        };
        const retrievalEvidence = buildHelixMcpEvidenceObservation({
          descriptor: requireMcpEvidenceDescriptor("helix_evidence_observation_get"),
          request: { observation_ref },
          payload,
          producerRef: `casimirbot-profile:${input.principal.accountProfileId}`,
          subjectRefs: [
            `account-profile:${input.principal.accountProfileId}`,
            observation_ref,
          ],
          summary: "Retrieved one still-valid owner-scoped MCP evidence observation for Codex re-entry.",
          payloadSchema: "helix.mcp_evidence_retrieval.v1",
          supportRefs: [observation_ref],
        });
        await input.evidenceStore.put({
          owner: {
            tenantId: input.principal.tenantId,
            accountProfileId: input.principal.accountProfileId,
          },
          toolName: "helix_evidence_observation_get",
          observation: retrievalEvidence,
        });
        return { ...payload, mcp_evidence: retrievalEvidence };
      },
      input.resourceMetadataPath,
    ),
  );
};

export const createHelixDeviceCheckMcpServer = (input: {
  principal: HelixAgentApiPrincipal;
  deviceCheckService?: HelixEnvironmentDeviceCheckServicePort;
  mcpEvidenceObservationStore?: HelixMcpEvidenceObservationStorePort;
}): McpServer => {
  const evidenceStore = input.mcpEvidenceObservationStore ??
    createPostgresHelixMcpEvidenceObservationStore();
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
    evidenceStore,
  });
  registerPublicUiCatalogTool({
    server,
    principal: input.principal,
    requiredScope: HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
    resourceMetadataPath: HELIX_DEVICE_CHECK_RESOURCE_METADATA_PATH,
    evidenceStore,
  });
  registerMcpEvidenceObservationGetTool({
    server,
    principal: input.principal,
    requiredScope: HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
    resourceMetadataPath: HELIX_DEVICE_CHECK_RESOURCE_METADATA_PATH,
    evidenceStore,
  });
  installOAuthToolCatalogAugmentation(
    server,
    new Map<string, RequiredOAuthScopes>([
      ["helix_environment_device_check", HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
      ["helix_public_ui_catalog", HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
      ["helix_evidence_observation_get", HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
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

const ROOM_TRANSITION_SHADOW_TOOL_SCOPES = new Map<
  string,
  RequiredOAuthScopes
>([
  ["helix_room_list", HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
  ["helix_room_inspect", HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
  ["helix_room_floor_inspect", HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
  ["helix_room_create", HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE],
  ["helix_room_presence_set", HELIX_MINECRAFT_ACTION_MCP_SCOPES],
  ["helix_room_consent_revoke", HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE],
  ["helix_room_consent_grant", HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE],
  ["helix_room_floor_release", HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE],
  ["helix_room_floor_acquire", HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE],
]);

const ENVIRONMENT_TRANSITION_SHADOW_TOOL_SCOPES = new Map<
  string,
  RequiredOAuthScopes
>([
  ["helix_room_source_list", HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE],
  ["helix_room_source_create", HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE],
  ["helix_environment_subject_list", HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
  ["helix_environment_subject_select", HELIX_MINECRAFT_ACTION_MCP_SCOPES],
  ["helix_environment_action_authority_inspect", HELIX_MINECRAFT_STATUS_MCP_SCOPES],
  ["helix_environment_action_authority_configure", HELIX_MINECRAFT_ACTION_MCP_SCOPES],
  ["helix_environment_command_authority_configure", HELIX_MINECRAFT_COMMAND_AUTHORITY_MCP_SCOPES],
  ["helix_environment_player_pair_local", HELIX_MINECRAFT_ACTION_MCP_SCOPES],
  ["helix_environment_source_pair_local", HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE],
  ["helix_environment_server_pair_local", HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE],
  ["helix_environment_action_authority_extend", HELIX_MINECRAFT_ACTION_MCP_SCOPES],
  ["helix_minecraft_actor_status", HELIX_MINECRAFT_STATUS_MCP_SCOPES],
  ["helix_minecraft_player_action", HELIX_MINECRAFT_ACTION_MCP_SCOPES],
  ["helix_minecraft_workflow_status", HELIX_MINECRAFT_STATUS_MCP_SCOPES],
  ["helix_minecraft_workflow_control", HELIX_MINECRAFT_ACTION_MCP_SCOPES],
]);

const roomTransitionShadowError = (
  requiredScopes: RequiredOAuthScopes,
) => {
  const payload = {
    schema: "helix.mcp_transition_shadow_error.v1" as const,
    error: "full_mcp_transition_required" as const,
    message:
      "This exact tool schema is pre-advertised for catalog continuity, but execution remains unavailable until the governed native tunnel transition reaches the full Helix MCP surface.",
    required_scopes: normalizeRequiredScopes(requiredScopes),
    retryable: true as const,
    mutation_executed: false as const,
    credential_included: false as const,
    private_endpoint_included: false as const,
    answer_authority: false as const,
    assistant_answer: false as const,
    terminal_eligible: false as const,
  };
  return {
    isError: true as const,
    content: [{ type: "text" as const, text: JSON.stringify(payload) }],
  };
};

const registerRoomTransitionShadowTools = (server: McpServer): void => {
  server.registerTool(
    "helix_room_list",
    {
      title: "List Shared Live Rooms",
      description:
        "Lists only rooms visible to the verified linked Helix account. The receipt is an observation and never an assistant answer.",
      inputSchema: z.object({}).strict(),
      outputSchema: roomListOutputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_READ_SCOPE),
    },
    async () => roomTransitionShadowError(HELIX_SHARED_LIVE_ROOM_READ_SCOPE),
  );
  server.registerTool(
    "helix_room_inspect",
    {
      title: "Inspect a Shared Live Room",
      description:
        "Inspects one opaque room ID after current account membership and policy checks.",
      inputSchema: z.object({ room_id: helixSharedLiveRoomIdSchema }).strict(),
      outputSchema: roomInspectOutputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_READ_SCOPE),
    },
    async () => roomTransitionShadowError(HELIX_SHARED_LIVE_ROOM_READ_SCOPE),
  );
  server.registerTool(
    "helix_room_floor_inspect",
    {
      title: "Inspect Shared Live Room speaking floor",
      description:
        "Reads the bounded current speaking-floor owner, epoch, and lease for one room after membership checks. Use the exact epoch for a safe release request.",
      inputSchema: z.object({ room_id: helixSharedLiveRoomIdSchema }).strict(),
      outputSchema: roomFloorInspectOutputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_READ_SCOPE),
    },
    async () => roomTransitionShadowError(HELIX_SHARED_LIVE_ROOM_READ_SCOPE),
  );
  server.registerTool(
    "helix_room_create",
    {
      title: "Create a Shared Live Room",
      description:
        "Idempotently creates a room owned by the verified linked Helix account. Caller-provided identity fields are not accepted.",
      inputSchema: z.object({
        idempotency_key: idempotencyKeySchema,
        request: helixSharedLiveRoomCreateRequestSchema,
      }).strict(),
      outputSchema: roomCreateOutputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE),
    },
    async () => roomTransitionShadowError(HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE),
  );
  server.registerTool(
    "helix_room_presence_set",
    {
      title: "Set own Shared Live Room presence",
      description:
        "Marks only the verified linked account participant present or away in an existing room. It cannot change another participant, consent, environment authority, or terminal authority.",
      inputSchema: z.object({ request: helixSharedLiveRoomPresenceSetRequestSchema }).strict(),
      outputSchema: roomPresenceSetOutputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      _meta: oauthToolMeta(HELIX_MINECRAFT_ACTION_MCP_SCOPES),
    },
    async () => roomTransitionShadowError(HELIX_MINECRAFT_ACTION_MCP_SCOPES),
  );
  server.registerTool(
    "helix_room_consent_revoke",
    {
      title: "Revoke own Shared Live Room consent",
      description:
        "Idempotently disables one or more consent grants owned by the verified linked account. This authority-reducing tool rejects true values and cannot grant microphone, transcript, screen, thumbnail, or model-audio permission.",
      inputSchema: z.object({
        idempotency_key: idempotencyKeySchema,
        request: helixSharedLiveRoomConsentRevokeRequestSchema,
      }).strict(),
      outputSchema: roomConsentRevokeOutputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE),
    },
    async () => roomTransitionShadowError(HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE),
  );
  server.registerTool(
    "helix_room_consent_grant",
    {
      title: "Grant own Shared Live Room consent with delegation",
      description:
        "Grants only explicitly selected consent fields for the verified linked participant. Requires a short-lived, signed, one-time delegation bound to this MCP client, conversation, account session, room, capability, and exact request.",
      inputSchema: z.object({
        idempotency_key: idempotencyKeySchema,
        request: helixSharedLiveRoomConsentGrantRequestSchema,
        delegation: jsonObjectSchema,
      }).strict(),
      outputSchema: roomConsentGrantOutputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE),
    },
    async () => roomTransitionShadowError(HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE),
  );
  server.registerTool(
    "helix_room_floor_release",
    {
      title: "Release own Shared Live Room speaking floor",
      description:
        "Releases only the verified linked participant's speaking floor for the exact inspected epoch. A stale epoch or another participant's floor is left unchanged.",
      inputSchema: z.object({ request: helixSharedLiveRoomFloorReleaseRequestSchema }).strict(),
      outputSchema: roomFloorReleaseOutputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE),
    },
    async () => roomTransitionShadowError(HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE),
  );
  server.registerTool(
    "helix_room_floor_acquire",
    {
      title: "Acquire own Shared Live Room speaking floor with delegation",
      description:
        "Acquires a bounded speaking-floor lease only for the verified linked participant. Requires a short-lived, signed, one-time delegation bound to this MCP client, conversation, account session, room, capability, and exact request.",
      inputSchema: z.object({
        idempotency_key: idempotencyKeySchema,
        request: helixSharedLiveRoomFloorAcquireRequestSchema,
        delegation: jsonObjectSchema,
      }).strict(),
      outputSchema: roomFloorAcquireOutputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE),
    },
    async () => roomTransitionShadowError(HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE),
  );
};

const registerEnvironmentTransitionShadowTools = (server: McpServer): void => {
  const deny = (requiredScopes: RequiredOAuthScopes) =>
    async () => roomTransitionShadowError(requiredScopes);
  server.registerTool("helix_room_source_list", {
    title: "List room source bindings",
    description:
      "Lists bounded non-authoritative source-binding projections for a developer-owned room. Credentials are never included.",
    inputSchema: z.object({ room_id: helixSharedLiveRoomIdSchema }).strict(),
    outputSchema: roomSourceListOutputSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE),
  }, deny(HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE));
  server.registerTool("helix_room_source_create", {
    title: "Create a deferred room source binding",
    description:
      "Idempotently creates source identity and returns only an opaque short-lived secure-delivery handle. It never returns the source bearer or plugin configuration.",
    inputSchema: z.object({
      room_id: helixSharedLiveRoomIdSchema,
      idempotency_key: idempotencyKeySchema,
      request: helixSharedLiveRoomSourceCreateRequestSchema,
    }).strict(),
    outputSchema: roomSourceCreateOutputSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE),
  }, deny(HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE));
  server.registerTool("helix_environment_subject_list", {
    title: "List my live environment subjects",
    description:
      "Lists sanitized subject directories and this authenticated room member's current environment identity. It never exposes native player IDs, connector credentials, or answer authority.",
    inputSchema: z.object({ room_id: helixSharedLiveRoomIdSchema }).strict(),
    outputSchema: helixRoomEnvironmentsReceiptSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_READ_SCOPE),
  }, deny(HELIX_SHARED_LIVE_ROOM_READ_SCOPE));
  server.registerTool("helix_environment_subject_select", {
    title: "Select my live environment subject",
    description:
      "Re-verifies only the authenticated room member's own exact subject from a fresh connector directory. It cannot assign another participant, expand permissions, or bypass subject conflicts and connector-epoch checks.",
    inputSchema: helixRoomEnvironmentSelfBindingRequestSchema.extend({
      room_id: helixSharedLiveRoomIdSchema,
      environment_binding_id: z.string().trim().min(1).max(320),
    }).strict(),
    outputSchema: helixRoomEnvironmentsReceiptSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    _meta: oauthToolMeta(HELIX_MINECRAFT_ACTION_MCP_SCOPES),
  }, deny(HELIX_MINECRAFT_ACTION_MCP_SCOPES));
  server.registerTool("helix_environment_action_authority_inspect", {
    title: "Inspect current player-action authority",
    description:
      "Lists the authenticated room member's visible Player Embodiment authorities and sanitized connector readiness for one exact environment. Credentials are never returned.",
    inputSchema: z.object({
      room_id: helixSharedLiveRoomIdSchema,
      environment_binding_id: z.string().trim().min(1).max(320),
    }).strict(),
    outputSchema: environmentActionAuthorityInspectOutputSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _meta: oauthToolMeta(HELIX_MINECRAFT_STATUS_MCP_SCOPES),
  }, deny(HELIX_MINECRAFT_STATUS_MCP_SCOPES));
  server.registerTool("helix_environment_action_authority_configure", {
    title: "Configure current player-action authority",
    description:
      "Lets the authenticated room owner configure the same finite Player Embodiment lease exposed by the owner UI. Exact participant/player binding, adapter capability registry, autonomy mode, manual override, and expiry remain server validated; no connector credential is returned.",
    inputSchema: z.object({
      room_id: helixSharedLiveRoomIdSchema,
      environment_binding_id: z.string().trim().min(1).max(320),
      settings: helixEnvironmentActionAuthoritySettingsSchema,
    }).strict(),
    outputSchema: environmentActionAuthorityConfigureOutputSchema,
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    _meta: oauthToolMeta(HELIX_MINECRAFT_ACTION_MCP_SCOPES),
  }, deny(HELIX_MINECRAFT_ACTION_MCP_SCOPES));
  server.registerTool("helix_environment_command_authority_configure", {
    title: "Configure current world command authority",
    description:
      "Lets the authenticated room owner configure the same finite Minecraft World Authority lease exposed by the owner UI. Authority profile, autonomy mode, approved command categories, environment ownership, and expiry remain server validated. This tool does not execute a command, issue a connector credential, expose pairing material, or grant host access.",
    inputSchema: z.object({
      room_id: helixSharedLiveRoomIdSchema,
      environment_binding_id: z.string().trim().min(1).max(320),
      settings: helixEnvironmentCommandAuthoritySettingsSchema,
    }).strict(),
    outputSchema: environmentCommandAuthorityConfigureOutputSchema,
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    _meta: oauthToolMeta(HELIX_MINECRAFT_COMMAND_AUTHORITY_MCP_SCOPES),
  }, deny(HELIX_MINECRAFT_COMMAND_AUTHORITY_MCP_SCOPES));
  server.registerTool("helix_environment_player_pair_local", {
    title: "Pair the same-host Minecraft player companion",
    description:
      "Creates an owner-authorized action-only pairing and stages it directly into the bounded same-host Fabric client inbox. The one-time code and connector credential never enter MCP output, model context, chat, or debug projections.",
    inputSchema: z.object({
      room_id: helixSharedLiveRoomIdSchema,
      binding_id: z.string().trim().min(1).max(320),
      action_authority_id: z.string().trim().min(1).max(320),
      credential_ttl_ms: z.number().int().min(60_000).max(30 * 24 * 60 * 60 * 1_000),
      idempotency_key: idempotencyKeySchema,
    }).strict(),
    outputSchema: environmentPlayerPairLocalOutputSchema,
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    _meta: oauthToolMeta(HELIX_MINECRAFT_ACTION_MCP_SCOPES),
  }, deny(HELIX_MINECRAFT_ACTION_MCP_SCOPES));
  const pairSchema = z.object({
    room_id: helixSharedLiveRoomIdSchema,
    binding_id: z.string().trim().min(1).max(320),
    credential_ttl_ms: z.number().int().min(60_000).max(30 * 24 * 60 * 60 * 1_000),
    idempotency_key: idempotencyKeySchema,
  }).strict();
  server.registerTool("helix_environment_source_pair_local", {
    title: "Re-pair same-host Minecraft read-only sensing",
    description:
      "Rotates only the read-only source credential for the authenticated owner's exact existing Fabric room-source binding and stages it into the fixed repository server inbox. Pairing material and connector credentials never enter MCP output, model context, chat, or debug projections. This tool grants neither World Authority nor Player Embodiment.",
    inputSchema: pairSchema,
    outputSchema: environmentSourcePairLocalOutputSchema,
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE),
  }, deny(HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE));
  server.registerTool("helix_environment_server_pair_local", {
    title: "Pair the same-host Minecraft server connector",
    description:
      "Creates an owner-authorized command-only pairing for the exact existing Fabric room-source binding and stages it into the fixed repository server inbox. The one-time code and connector credential never enter MCP output, model context, chat, or debug projections. This tool does not execute Minecraft commands or grant command authority.",
    inputSchema: pairSchema,
    outputSchema: environmentServerPairLocalOutputSchema,
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE),
  }, deny(HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE));
  server.registerTool("helix_environment_action_authority_extend", {
    title: "Extend an exact player-action authority lease",
    description:
      "Lets the authenticated room owner extend only the expiry of one exact active Player Embodiment authority and its existing connector credential. Capability policy, subject, participant, world, adapter, autonomy mode, and policy version remain unchanged; no credential is returned.",
    inputSchema: z.object({
      room_id: helixSharedLiveRoomIdSchema,
      environment_binding_id: z.string().trim().min(1).max(320),
      action_authority_id: z.string().trim().min(1).max(320),
      expires_at: z.string().datetime({ offset: true }).refine((value) => {
        const delta = Date.parse(value) - Date.now();
        return delta >= 60_000 && delta <= 7 * 24 * 60 * 60_000;
      }, "Lease expiry must be between one minute and seven days in the future."),
    }).strict(),
    outputSchema: environmentActionAuthorityExtendOutputSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _meta: oauthToolMeta(HELIX_MINECRAFT_ACTION_MCP_SCOPES),
  }, deny(HELIX_MINECRAFT_ACTION_MCP_SCOPES));
  server.registerTool("helix_minecraft_actor_status", {
    title: "Read the selected Minecraft actor status",
    description:
      "Requests one fresh, read-only actor-status observation through the authenticated room, selected player subject, active connector, and exact probe schema. The result also carries a separately labeled same-revision perception snapshot compatibility observation for clients whose MCP catalog has not yet refreshed; callers should still refresh their catalog to use the dedicated situation-probe tool. Both observations are evidence for Codex re-entry, never assistant answers or terminal authority.",
    inputSchema: z.object({ room_id: helixSharedLiveRoomIdSchema }).strict(),
    outputSchema: minecraftActorStatusOutputSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    _meta: oauthToolMeta(HELIX_MINECRAFT_STATUS_MCP_SCOPES),
  }, deny(HELIX_MINECRAFT_STATUS_MCP_SCOPES));
  server.registerTool("helix_minecraft_player_action", {
    title: "Execute a typed Minecraft player action",
    description:
      "Executes one bounded typed action or an admitted concurrent guardian program through the exact room, participant/player binding, Fabric action authority, live manifest, lease, resource locks, and manual-override policy. For perception-guided play, pass the exact fresh semantic_fingerprint: the harness derives a stable action identity so the same action against unchanged perception cannot become a second physical effect merely by changing the caller's idempotency key. It does not accept raw server commands, shell, files, credentials, pairing material, or embedded model code. The returned observation must re-enter Codex before any answer is written.",
    inputSchema: z.object({
      room_id: helixSharedLiveRoomIdSchema,
      idempotency_key: idempotencyKeySchema,
      perception_semantic_fingerprint: z.string().regex(/^sha256:[a-f0-9]{64}$/u).optional(),
      principal_turn_id: z.string().trim().min(1).max(320).optional(),
      environment_label: z.string().trim().min(1).max(240).optional(),
      action: minecraftPlayerActionInputSchema,
    }).strict(),
    outputSchema: minecraftPlayerActionOutputSchema,
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
    _meta: oauthToolMeta(HELIX_MINECRAFT_ACTION_MCP_SCOPES),
  }, deny(HELIX_MINECRAFT_ACTION_MCP_SCOPES));
  const workflowSchema = z.object({
    room_id: helixSharedLiveRoomIdSchema,
    workflow_ref: z.string().trim().min(1).max(320),
  });
  server.registerTool("helix_minecraft_workflow_status", {
    title: "Read a Minecraft player workflow status",
    description:
      "Reads one exact admitted workflow through its room/player authority. The result is a current non-terminal observation, not an assistant answer.",
    inputSchema: workflowSchema.strict(),
    outputSchema: minecraftWorkflowControlOutputSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _meta: oauthToolMeta(HELIX_MINECRAFT_STATUS_MCP_SCOPES),
  }, deny(HELIX_MINECRAFT_STATUS_MCP_SCOPES));
  server.registerTool("helix_minecraft_workflow_control", {
    title: "Control a Minecraft player workflow",
    description:
      "Resumes, cancels, or emergency-stops one exact admitted workflow. Cancellation and Emergency Stop require the Fabric client to release asserted controls; the returned receipt is evidence, never answer authority.",
    inputSchema: workflowSchema.extend({
      control: z.enum(["resume", "cancel", "emergency_stop"]),
      reason: z.string().trim().min(1).max(1_000).optional(),
    }).strict(),
    outputSchema: minecraftWorkflowControlOutputSchema,
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    _meta: oauthToolMeta(HELIX_MINECRAFT_ACTION_MCP_SCOPES),
  }, deny(HELIX_MINECRAFT_ACTION_MCP_SCOPES));
};

const runIdSchema = z
  .string()
  .trim()
  .regex(/^run_[A-Za-z0-9._:-]{8,200}$/)
  .describe("Opaque durable run ID returned by helix_run_start.");

export type HelixEnvironmentSubjectMcpService = {
  list(input: {
    roomId: string;
    profileId: string;
  }): Promise<HelixRoomEnvironmentProjection[]>;
  select(input: {
    roomId: string;
    profileId: string;
    environmentBindingId: string;
    subjectRef: string;
  }): Promise<HelixRoomEnvironmentSubjectBinding>;
};

export type DesktopMcpTunnelTransitionExecutor = (input: {
  transitionRequestRef: string;
  delegationRef: string;
  accountSessionId: string;
  targetScope: DesktopMcpTransitionTarget;
  delegationExpiresAt: string;
}) => Promise<{
  accepted: true;
  nativeReceiptRef: string;
}>;

export const createHelixMcpServer = (input: {
  principal: HelixAgentApiPrincipal;
  surface?: "full" | "local_supervisor_coordination";
  service?: HelixAgentApiService;
  localSupervisorCoordinationStore?: HelixLocalSupervisorCoordinationStore;
  desktopMcpTunnelTransitionStore?: DesktopMcpTunnelTransitionStore;
  desktopMcpTunnelTransitionExecutor?: DesktopMcpTunnelTransitionExecutor;
  localSupervisorExecutionLeaseClaimReader?:
    HelixLocalSupervisorExecutionLeaseClaimReader;
  localSupervisorEnvironmentIdentityReader?:
    HelixLocalSupervisorEnvironmentIdentityReader;
  roomControlService?: SharedLiveRoomControlService;
  roomMcpDelegationIdentity?: {
    authenticatedMcpClientRef: string;
    conversationThreadRef: string;
    accountSessionId: string;
  };
  roomMcpDelegationVerifier?: SharedLiveRoomMcpDelegationVerifier;
  roomBindingStore?: Pick<
    SharedLiveRoomBindingStore,
    | "bindRunToRoom"
    | "getActiveRunRoomBinding"
    | "claimPendingChatBinding"
    | "revokeRunRoomBindingForOwner"
    | "revokeClaimedRunChatBindingForOwner"
  >;
  deviceCheckService?: HelixEnvironmentDeviceCheckServicePort;
  environmentSubjectService?: HelixEnvironmentSubjectMcpService;
  environmentActionExecutor?: HelixEnvironmentActionMcpExecutor;
  environmentActionControlExecutor?: HelixEnvironmentActionControlMcpExecutor;
  environmentProbeExecutor?: HelixEnvironmentProbeMcpExecutor;
  brokerageReadExecutor?: HelixBrokerageReadMcpExecutor;
  brokerageReadAcceptanceRunner?: HelixBrokerageReadAcceptanceRunner;
  brokerageLiveAcceptanceReadinessReader?:
    HelixBrokerageLiveAcceptanceReadinessReader;
  brokerageRoomBinder?: HelixBrokerageRoomBinder;
  brokerageResidentBootstrapper?: HelixBrokerageResidentBootstrapper;
  brokerageMarketObserverRunner?: HelixBrokerageMarketObserverMcpRunner;
  brokerageMarketObserverSemanticSource?: HelixBrokerageMarketObserverSemanticSourcePort;
  environmentDurableGoalService?: HelixEnvironmentDurableGoalMcpStore;
  environmentReasoningRoleService?: HelixEnvironmentReasoningRoleMcpStore;
  environmentMonitorService?: HelixEnvironmentMonitorMcpStore;
  environmentMonitorSemanticSource?: HelixEnvironmentMonitorSemanticSourcePort;
  environmentActionAuthorityInspector?: HelixEnvironmentActionAuthorityInspector;
  environmentActionAuthorityConfigurator?: HelixEnvironmentActionAuthorityConfigurator;
  environmentCommandAuthorityConfigurator?: HelixEnvironmentCommandAuthorityConfigurator;
  environmentActionAuthorityLeaseExtender?: HelixEnvironmentActionAuthorityLeaseExtender;
  environmentPlayerPairLocalHandoff?: HelixEnvironmentPlayerPairLocalHandoff;
  environmentSourcePairLocalHandoff?: HelixEnvironmentSourcePairLocalHandoff;
  environmentServerPairLocalHandoff?: HelixEnvironmentServerPairLocalHandoff;
  mcpEvidenceObservationStore?: HelixMcpEvidenceObservationStorePort;
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
  const evidenceStore = input.mcpEvidenceObservationStore ??
    createPostgresHelixMcpEvidenceObservationStore();
  const executionLeaseClaimReader =
    input.localSupervisorExecutionLeaseClaimReader ??
      readEnvironmentActionExecutionLeaseClaim;
  const localSupervisorEnvironmentIdentityReader =
    input.localSupervisorEnvironmentIdentityReader ??
      readLocalSupervisorEnvironmentIdentity;
  const environmentSubjectService = input.environmentSubjectService ?? {
    list: listRoomEnvironmentProjections,
    select: bindOwnRoomEnvironmentSubject,
  };
  const environmentActionExecutor =
    input.environmentActionExecutor ?? executeEnvironmentActionGatewayCapability;
  const environmentActionControlExecutor =
    input.environmentActionControlExecutor ??
      executeEnvironmentActionControlGatewayCapability;
  const environmentProbeExecutor =
    input.environmentProbeExecutor ?? executeEnvironmentProbeGatewayCapability;
  const brokerageReadExecutor =
    input.brokerageReadExecutor ?? executeBrokerageReadGatewayCapability;
  const brokerageReadAcceptanceRunner =
    input.brokerageReadAcceptanceRunner ?? runRobinhoodReadAcceptance;
  const brokerageLiveAcceptanceReadinessReader =
    input.brokerageLiveAcceptanceReadinessReader ??
      readRobinhoodLiveAcceptanceReadiness;
  const brokerageRoomBinder =
    input.brokerageRoomBinder ?? attachRobinhoodConnectionToPrivateRoom;
  const brokerageResidentBootstrapper =
    input.brokerageResidentBootstrapper ?? bootstrapBrokerageResidentObserver;
  const brokerageObserverRunner =
    input.brokerageMarketObserverRunner ?? runBrokerageMarketObserverCycle;
  const brokerageObserverSemanticSource =
    input.brokerageMarketObserverSemanticSource ??
      brokerageMarketObserverSemanticSource;
  const durableGoalService =
    input.environmentDurableGoalService ?? environmentDurableGoalStore;
  const reasoningRoleService =
    input.environmentReasoningRoleService ?? environmentReasoningRoleStore;
  const monitorService =
    input.environmentMonitorService ?? environmentMonitorStore;
  const monitorSemanticSource =
    input.environmentMonitorSemanticSource ?? environmentMonitorSemanticSource;
  const actionAuthorityInspector =
    input.environmentActionAuthorityInspector ??
    (async (request) => ({
      authorities: await readEnvironmentActionAuthorities(request),
      connectorReadiness: await readEnvironmentActionConnectorReadiness(
        request,
      ),
    }));
  const actionAuthorityConfigurator =
    input.environmentActionAuthorityConfigurator ??
      configureEnvironmentActionAuthority;
  const commandAuthorityConfigurator =
    input.environmentCommandAuthorityConfigurator ??
      configureEnvironmentCommandAuthority;
  const actionAuthorityLeaseExtender =
    input.environmentActionAuthorityLeaseExtender ??
      extendEnvironmentActionAuthorityLease;
  const playerPairLocalHandoff =
    input.environmentPlayerPairLocalHandoff ??
    (async (request) => {
      const created = await createConnectorBootstrapPairing({
        roomId: request.roomId,
        ownerProfileId: request.ownerProfileId,
        purpose: "rotate",
        bindingId: request.bindingId,
        domainAdapter: "minecraft.fabric_mod.v1",
        credentialTtlMs: request.credentialTtlMs,
        commandCredentialRequested: false,
        actionCredentialRequested: true,
        actionAuthorityId: request.actionAuthorityId,
        idempotencyKey: request.idempotencyKey,
      });
      const staged = await stageLocalMinecraftPlayerPairing({
        command: `/helix-player pair ${created.pairingCode}`,
        ownerProfileId: request.ownerProfileId,
      });
      return {
        pairing: created.pairing as unknown as RecordLike,
        status: staged.status,
      };
    });
  const serverPairLocalHandoff =
    input.environmentServerPairLocalHandoff ??
    (async (request) => {
      const created = await createConnectorBootstrapPairing({
        roomId: request.roomId,
        ownerProfileId: request.ownerProfileId,
        purpose: "rotate",
        bindingId: request.bindingId,
        domainAdapter: "minecraft.fabric_mod.v1",
        credentialTtlMs: request.credentialTtlMs,
        commandCredentialRequested: true,
        actionCredentialRequested: false,
        idempotencyKey: request.idempotencyKey,
      });
      const staged = await stageLocalMinecraftServerPairing({
        command: `/helix pair ${created.pairingCode}`,
        ownerProfileId: request.ownerProfileId,
        pairingEndpoint: resolveLocalMinecraftPairingEndpoint({
          serviceBaseUrl: process.env.CASIMIR_PUBLIC_BASE_URL,
          requestBaseUrl:
            `http://127.0.0.1:${process.env.PORT?.trim() || "1522"}`,
        }),
      });
      return {
        pairing: created.pairing as unknown as RecordLike,
        status: staged.status,
      };
    });
  const sourcePairLocalHandoff =
    input.environmentSourcePairLocalHandoff ??
    (async (request) => {
      const created = await createConnectorBootstrapPairing({
        roomId: request.roomId,
        ownerProfileId: request.ownerProfileId,
        purpose: "rotate",
        bindingId: request.bindingId,
        domainAdapter: "minecraft.fabric_mod.v1",
        credentialTtlMs: request.credentialTtlMs,
        commandCredentialRequested: false,
        actionCredentialRequested: false,
        idempotencyKey: request.idempotencyKey,
      });
      const staged = await stageLocalMinecraftServerPairing({
        command: `/helix pair ${created.pairingCode}`,
        ownerProfileId: request.ownerProfileId,
        pairingEndpoint: resolveLocalMinecraftPairingEndpoint({
          serviceBaseUrl: process.env.CASIMIR_PUBLIC_BASE_URL,
          requestBaseUrl:
            `http://127.0.0.1:${process.env.PORT?.trim() || "1522"}`,
        }),
      });
      return {
        pairing: created.pairing as unknown as RecordLike,
        status: staged.status,
      };
    });
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
  const requireMonitorClientRef = (): string => {
    const ref = input.principal.mcpClientRef?.trim() ||
      input.principal.oauthClientRef?.trim();
    if (ref) return ref;
    throw new EnvironmentMonitorStoreError(
      "mcp_client_identity_required",
      403,
      "The request does not identify an authenticated MCP client.",
    );
  };
  const requireLocalSupervisorClientRef = (): string => {
    const ref = input.principal.mcpClientRef?.trim() ||
      input.principal.oauthClientRef?.trim();
    if (ref) return ref;
    throw new HelixAgentApiServiceError(
      403,
      "mcp_client_identity_required",
      "The request does not identify an authenticated MCP client.",
      false,
    );
  };
  const consumeRoomMcpDelegation = async (args: {
    capabilityId: "room.consent.grant" | "room.floor.acquire";
    roomId: string;
    request: unknown;
    receipt: unknown;
  }): Promise<string> => {
    const identity = input.roomMcpDelegationIdentity;
    const verifier = input.roomMcpDelegationVerifier;
    const authenticatedClientRef = input.principal.mcpClientRef?.trim() ||
      input.principal.oauthClientRef?.trim();
    if (!identity || !authenticatedClientRef) {
      throw new HelixAgentApiServiceError(
        403,
        "room_mcp_delegation_identity_unavailable",
        "A trusted MCP client and conversation binding is required for this room mutation.",
        false,
      );
    }
    if (
      identity.authenticatedMcpClientRef !== authenticatedClientRef ||
      identity.accountSessionId !== input.principal.accountContext.session_id
    ) {
      throw new HelixAgentApiServiceError(
        403,
        "room_mcp_delegation_identity_mismatch",
        "The trusted MCP delegation identity does not match the authenticated principal.",
        false,
      );
    }
    if (!verifier) {
      throw new HelixAgentApiServiceError(
        503,
        "room_mcp_delegation_verifier_unavailable",
        "The trusted room MCP delegation verifier is not configured.",
        true,
      );
    }
    const sealedInputSha256 =
      await computeHelixSharedLiveRoomMcpDelegationSealedInputSha256V1(
        args.capabilityId,
        args.request,
      );
    const result = await verifier.consume({
      receipt: args.receipt,
      expectedBinding: {
        capabilityId: args.capabilityId,
        accountType: input.principal.accountType,
        profileId: input.principal.accountProfileId,
        accountSessionId: identity.accountSessionId,
        authenticatedMcpClientRef: identity.authenticatedMcpClientRef,
        conversationThreadRef: identity.conversationThreadRef,
        roomId: args.roomId,
        sealedInputSha256,
      },
    });
    if (!result.ok) {
      throw new HelixAgentApiServiceError(
        403,
        "room_mcp_delegation_rejected",
        "The signed room MCP delegation was rejected.",
        false,
        { issues: result.issues },
      );
    }
    return result.delegationRef;
  };
  const localSupervisorIdentity = (continuationRef: string) => {
    const authenticatedClientRef = requireLocalSupervisorClientRef();
    const binding = [
      input.principal.issuer,
      input.principal.subjectId,
      input.principal.accountProfileId,
      authenticatedClientRef,
      continuationRef,
    ].join("\n");
    return {
      authenticatedClientRef,
      clientSessionRef: `supervisor_client:${crypto.createHash("sha256").update(
        `${input.localSupervisorCoordinationStore?.serviceInstanceRef ?? "missing"}\n${binding}`,
        "utf8",
      ).digest("hex").slice(0, 32)}`,
      conversationThreadRef: continuationRef,
      accountSessionId: `mcp:${crypto.createHash("sha256").update(binding, "utf8").digest("hex")}`,
    };
  };
  const callLocalSupervisorTool = async (
    requiredScopes: RequiredOAuthScopes,
    operation: () => Promise<RecordLike> | RecordLike,
  ) => {
    try {
      return toolSuccess(await operation());
    } catch (error) {
      if (error instanceof HelixLocalSupervisorCoordinationError) {
        return toolError(new HelixAgentApiServiceError(
          error.status,
          error.code,
          "The local-supervisor coordination request was rejected.",
          error.status >= 500,
        ), requiredScopes);
      }
      if (error instanceof DesktopMcpTunnelTransitionError) {
        const value = {
          schema: "helix.desktop_tunnel_transition_error.v1" as const,
          error: error.code,
          message: "The governed desktop tunnel transition request was rejected.",
          retryable: error.status >= 500,
          credential_included: false as const,
          private_endpoint_included: false as const,
          authority_limited_to_tunnel_transport: true as const,
          environment_authority_granted: false as const,
          trading_authority_granted: false as const,
          content_role: "desktop_tunnel_transition_error_not_assistant_answer" as const,
          answer_authority: false as const,
          assistant_answer: false as const,
          terminal_eligible: false as const,
        };
        return {
          isError: true as const,
          content: [{ type: "text" as const, text: JSON.stringify(value) }],
          structuredContent: value,
        };
      }
      return toolError(error, requiredScopes);
    }
  };
  const monitorAccess = (
    argumentsValue: HelixEnvironmentMonitorAccessToolArguments,
  ) => ({
    monitorId: argumentsValue.monitor_id,
    profileId: input.principal.accountProfileId,
    mcpClientId: requireMonitorClientRef(),
    clientContinuationRef: argumentsValue.client_continuation_ref,
  });
  const monitorOutput = (
    operation:
      | "environment.monitor.create"
      | "environment.monitor.inspect"
      | "environment.monitor.acknowledge"
      | "environment.monitor.snapshot_record"
      | "environment.monitor.revoke",
    lease: z.infer<typeof helixEnvironmentMonitorLeaseSchema>,
  ) => ({
    operation,
    lease,
    credential_included: false as const,
    raw_events_included: false as const,
    content_role: "environment_monitor_control_not_assistant_answer" as const,
    reentry_required: true as const,
    answer_authority: false as const,
    assistant_answer: false as const,
    terminal_eligible: false as const,
  });
  const coordinationOnly = input.surface === "local_supervisor_coordination";
  if (coordinationOnly && !input.localSupervisorCoordinationStore) {
    throw new Error("local_supervisor_coordination_store_required");
  }
  const server = new McpServer(
    {
      name: coordinationOnly
        ? "casimirbot-local-supervisor-coordination"
        : "casimirbot-helix-agent",
      version: "1.0.0",
    },
    {
      instructions: coordinationOnly ? [
        "This MCP resource exposes only authenticated local-supervisor presence and advisory coordination for one installed node.",
        "Shared Live Room and bounded environment-control tool schemas are pre-advertised only for transition continuity; every shadow call fails closed until the governed native tunnel targets the full Helix MCP surface.",
        "Relay text is inert and cannot execute commands, transfer authority, restart a process, satisfy evidence, or become an assistant answer.",
        "Use one stable client_continuation_ref per Codex conversation and revalidate after a service-epoch change.",
      ].join(" ") : [
        "Use the durable run_id returned by helix_run_start for all later calls.",
        "Mutations require a caller-stable idempotency_key and continuations require expected_version.",
        "completion_status and terminal_authority_status are separate. Evidence and MCP tool output are not assistant answers.",
        "Room and source receipts are non-authoritative; source creation returns only an opaque secure-delivery handle, never a source bearer.",
        "Raw Shared Live Room server-command execution is disabled. Typed Minecraft player actions use a separately paired action authority; sensor credentials are never action credentials.",
        "Minecraft action and workflow-control results are observations for Codex re-entry, never assistant answers or terminal authority.",
        "Durable environment-goal projections are checkpoint context for Codex re-entry; they never choose strategy, write an answer, or grant terminal authority.",
        "One installed node serves many authenticated clients on one MCP origin. Do not start, stop, or replace a server to obtain a separate chat session.",
        "For local multi-client coordination, register or refresh presence with one stable client_continuation_ref, read coordination before waiting on a contested resource, acknowledge only relays addressed to this derived client, and disconnect presence when finished.",
        "Concurrent reads remain grant-scoped. Mutations remain serialized by the existing server-owned execution lease; presence claims and relay text cannot create, transfer, or release mutation authority.",
        "After the service epoch changes, reconnect and revalidate room membership, connector state, retained runs, and execution authority before continuing.",
        "Continue only while progress is possible and within the declared run budget.",
      ].join(" "),
    },
  );

  const localSupervisorContinuationSchema = z.string().trim().min(3).max(320)
    .refine((value) => !/[\r\n\t]/u.test(value))
    .refine((value) => !/(?:https?:\/\/|bearer\s|token=|password=|community=)/iu.test(value));
  const localSupervisorOptionalRefSchema = localSupervisorContinuationSchema.nullable().optional();
  const localSupervisorFlags = {
    credential_included: false as const,
    private_endpoint_included: false as const,
    hidden_reasoning_included: false as const,
    answer_authority: false as const,
    assistant_answer: false as const,
    terminal_eligible: false as const,
    raw_content_included: false as const,
  };

  registerMcpEvidenceObservationGetTool({
    server,
    principal: input.principal,
    requiredScope: coordinationOnly
      ? HELIX_SHARED_LIVE_ROOM_READ_SCOPE
      : HELIX_AGENT_RUN_READ_SCOPE,
    resourceMetadataPath: coordinationOnly
      ? HELIX_LOCAL_SUPERVISOR_COORDINATION_RESOURCE_METADATA_PATH
      : undefined,
    evidenceStore,
  });

  if (coordinationOnly) {
    registerEnvironmentDeviceCheckTool({
      server,
      principal: input.principal,
      deviceCheckService,
      resourceMetadataPath:
        HELIX_LOCAL_SUPERVISOR_COORDINATION_RESOURCE_METADATA_PATH,
      evidenceStore,
    });
    registerPublicUiCatalogTool({
      server,
      principal: input.principal,
      requiredScope: HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
      resourceMetadataPath:
        HELIX_LOCAL_SUPERVISOR_COORDINATION_RESOURCE_METADATA_PATH,
      evidenceStore,
    });
    registerRoomTransitionShadowTools(server);
    registerEnvironmentTransitionShadowTools(server);
  }

  if (!coordinationOnly) {
  registerPublicUiCatalogTool({
    server,
    principal: input.principal,
    requiredScope: HELIX_AGENT_RUN_READ_SCOPE,
    evidenceStore,
  });

  server.registerTool(
    "helix_realtime_texture_pack_inspect",
    {
      title: "Inspect Realtime Texture Pack harness control",
      description: "Reads the sanitized state of the developer-enabled Image Lens control lease. It returns no screen pixels, prompt text, credentials, or answer authority.",
      inputSchema: z.object({}).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      _meta: oauthToolMeta(HELIX_AGENT_RUN_READ_SCOPE),
    },
    async () => callTool(HELIX_AGENT_RUN_READ_SCOPE, async () => {
      requireHelixAgentApiScope(input.principal, HELIX_AGENT_RUN_READ_SCOPE);
      if (input.principal.accountType !== "developer") {
        throw new HelixAgentApiServiceError(403, "developer_account_required", "Realtime Texture Pack harness control is restricted to developer accounts.", false);
      }
      return {
        ...realtimeTexturePackHarnessStore.inspect(input.principal.accountProfileId),
        attended_provider: inspectAttendedFalControlProjection(input.principal.accountProfileId),
      };
    }),
  );

  server.registerTool(
    "helix_realtime_texture_pack_control",
    {
      title: "Control an enabled Realtime Texture Pack overlay",
      description: "Queues show, reveal-original, or stop for an existing user-selected capture. Image Lens must hold an active user-enabled lease; this tool cannot start capture or select a source.",
      inputSchema: z.object({ action: z.enum(REALTIME_TEXTURE_PACK_HARNESS_ACTIONS) }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      _meta: oauthToolMeta(HELIX_AGENT_RUN_WRITE_SCOPE),
    },
    async ({ action }) => callTool(HELIX_AGENT_RUN_WRITE_SCOPE, async () => {
      requireHelixAgentApiScope(input.principal, HELIX_AGENT_RUN_WRITE_SCOPE);
      if (input.principal.accountType !== "developer") {
        throw new HelixAgentApiServiceError(403, "developer_account_required", "Realtime Texture Pack harness control is restricted to developer accounts.", false);
      }
      const result = realtimeTexturePackHarnessStore.enqueue(input.principal.accountProfileId, action);
      return {
        ...result,
        queued_receipt_not_execution_proof: result.ok,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      };
    }),
  );

  server.registerTool(
    "helix_realtime_texture_pack_visual_direction_control",
    {
      title: "Control enabled Realtime Texture Pack visual direction",
      description: "Queues one revision-checked prompt-direction change for an existing user-selected capture. It cannot start capture, select a source/provider, arm billing, inspect pixels, retrieve prompt bodies, or steer the environment.",
      inputSchema: z.object({
        command: z.enum(REALTIME_TEXTURE_PACK_VISUAL_DIRECTION_COMMANDS),
        expected_configuration_revision: z.number().int().nonnegative(),
        preset_id: z.enum(["playable", "painterly", "custom"]).optional(),
        custom_visual_directive: z.string().trim().max(1_000).optional(),
        enabled_cue_families: z.array(z.enum([
          "dimension", "biome", "time", "weather", "lighting",
          "activity", "hazards", "focus", "workflow",
        ])).max(9).optional(),
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      _meta: oauthToolMeta(HELIX_AGENT_RUN_WRITE_SCOPE),
    },
    async ({ command, expected_configuration_revision, preset_id, custom_visual_directive, enabled_cue_families }) =>
      callTool(HELIX_AGENT_RUN_WRITE_SCOPE, async () => {
        requireHelixAgentApiScope(input.principal, HELIX_AGENT_RUN_WRITE_SCOPE);
        if (input.principal.accountType !== "developer") {
          throw new HelixAgentApiServiceError(403, "developer_account_required", "Realtime Texture Pack visual-direction control is restricted to developer accounts.", false);
        }
        const commandArguments = parseRealtimeTexturePackVisualDirectionCommandArguments({
          command,
          ...(command === "set_visual_direction_profile" ? { preset_id } : {}),
          ...(command === "set_custom_visual_directive" ? { custom_visual_directive } : {}),
          ...(command === "set_dynamic_cue_policy" ? { enabled_cue_families } : {}),
        });
        if (!commandArguments) {
          throw new HelixAgentApiServiceError(400, "visual_direction_command_arguments_invalid", "The visual-direction command arguments do not match the selected command.", false);
        }
        const result = realtimeTexturePackHarnessStore.enqueueVisualDirection({
          profileId: input.principal.accountProfileId,
          arguments: commandArguments,
          expectedConfigurationRevision: expected_configuration_revision,
        });
        return {
          ...result,
          queued_receipt_not_execution_proof: result.ok,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        };
      }),
  );
  }

  if (input.localSupervisorCoordinationStore) {
    const coordinationStore = input.localSupervisorCoordinationStore;
    server.registerTool(
      "helix_local_supervisor_presence_update",
      {
        title: "Update this Codex client's local-supervisor presence",
        description: "Registers or refreshes this authenticated MCP client and declared Codex continuation on the installed node. Objective text and unverified resource claims remain inert advisory data.",
        inputSchema: z.object({
          client_continuation_ref: localSupervisorContinuationSchema,
          declared_objective_summary: z.string().trim().min(1).max(360),
          lifecycle_state: helixLocalSupervisorLifecycleStateSchema,
          resource_claims: z.array(helixLocalSupervisorResourceClaimInputSchema).max(24).default([]),
          room_ref: localSupervisorOptionalRefSchema,
          environment_ref: localSupervisorOptionalRefSchema,
          run_ref: localSupervisorOptionalRefSchema,
          blocker_summary: z.string().trim().max(240).nullable().optional(),
          heartbeat_ttl_seconds: z.number().int().min(15).max(180).default(60),
        }).strict(),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        _meta: oauthToolMeta(HELIX_LOCAL_SUPERVISOR_READ_MCP_SCOPES),
      },
      async (args) => callLocalSupervisorTool(HELIX_LOCAL_SUPERVISOR_READ_MCP_SCOPES, async () => {
        requireAllAgentScopes(HELIX_LOCAL_SUPERVISOR_READ_MCP_SCOPES);
        const identity = localSupervisorIdentity(args.client_continuation_ref);
        const verifiedClaims = new Map<string, string>();
        const verifiedIdentity: {
          -readonly [Key in keyof HelixLocalSupervisorVerifiedIdentity]?:
            HelixLocalSupervisorVerifiedIdentity[Key];
        } = {};
        const verificationRef = (kind: string, value: string): string =>
          `supervisor_verification:${kind}:${crypto.createHash("sha256").update(
            `${coordinationStore.serviceInstanceRef}\n${input.principal.accountProfileId}\n${value}`,
            "utf8",
          ).digest("hex").slice(0, 32)}`;
        const roomClaimRequested = Boolean(args.room_ref &&
          args.resource_claims.some((claim) =>
            claim.claim_class === "read" &&
            claim.resource_ref === args.room_ref));
        const environmentClaimRequested = Boolean(args.environment_ref &&
          args.resource_claims.some((claim) =>
            claim.claim_class === "read" &&
            claim.resource_ref === args.environment_ref));
        const retainedRuntimeClaimRequested = Boolean(args.run_ref &&
          args.resource_claims.some((claim) =>
            claim.claim_class === "retained_runtime" &&
            claim.resource_ref === args.run_ref));
        const mutationClaim = args.resource_claims.find((claim) =>
          claim.claim_class === "mutation_lease_active");
        const needsRoomIdentity = roomClaimRequested ||
          environmentClaimRequested || retainedRuntimeClaimRequested ||
          Boolean(mutationClaim);
        let roomParticipantId: string | null = null;
        if (args.room_ref && needsRoomIdentity) {
          roomParticipantId = await resolveSelfParticipantId(args.room_ref);
          const roomVerificationRef = verificationRef(
            "room_membership",
            `${args.room_ref}:${roomParticipantId}`,
          );
          verifiedIdentity.room = {
            roomRef: args.room_ref,
            participantRef: roomParticipantId,
            verificationRef: roomVerificationRef,
          };
          if (roomClaimRequested) {
          verifiedClaims.set(
            `read\n${args.room_ref}`,
              roomVerificationRef,
          );
          }
        }
        let environmentIdentity: LocalSupervisorEnvironmentIdentity | null =
          null;
        if (args.room_ref && roomParticipantId && args.environment_ref &&
            (environmentClaimRequested || mutationClaim)) {
          environmentIdentity = await localSupervisorEnvironmentIdentityReader({
            roomId: args.room_ref,
            profileId: input.principal.accountProfileId,
            participantId: roomParticipantId,
            environmentBindingId: args.environment_ref,
          });
          if (environmentIdentity &&
              environmentIdentity.roomId === args.room_ref &&
              environmentIdentity.participantId === roomParticipantId &&
              environmentIdentity.environmentBindingId ===
                args.environment_ref) {
            const connectorVerificationRef = verificationRef(
              "connector_source_epoch",
              [environmentIdentity.environmentBindingId,
                environmentIdentity.connectorInstallationId,
                environmentIdentity.sourceId,
                environmentIdentity.producerEpochRef].join(":"),
            );
            verifiedIdentity.connector = {
              environmentRef: environmentIdentity.environmentBindingId,
              connectorInstallationRef:
                environmentIdentity.connectorInstallationId,
              sourceRef: environmentIdentity.sourceId,
              producerEpochRef: environmentIdentity.producerEpochRef,
              verificationRef: connectorVerificationRef,
            };
            if (environmentClaimRequested) {
            verifiedClaims.set(
              `read\n${args.environment_ref}`,
                connectorVerificationRef,
            );
            }
          }
        }
        if (args.run_ref && args.room_ref && roomParticipantId &&
            input.principal.scopes.has(HELIX_AGENT_RUN_READ_SCOPE) &&
            retainedRuntimeClaimRequested) {
          const run = await service.inspectRun({
            principal: input.principal,
            runId: args.run_ref,
          });
          const runRoomBinding = await roomBindingStore.getActiveRunRoomBinding({
            owner: {
              tenantId: input.principal.tenantId,
              issuer: input.principal.issuer,
              subjectId: input.principal.subjectId,
              accountProfileId: input.principal.accountProfileId,
            },
            runId: args.run_ref,
          });
          if (["queued", "running", "waiting"].includes(run.lifecycle_status) &&
              runRoomBinding?.roomId === args.room_ref &&
              runRoomBinding.participantIdAtBind === roomParticipantId) {
            const runVerificationRef = verificationRef(
              "retained_agent_run",
              [run.run_id, run.version, run.lifecycle_status,
                runRoomBinding.bindingId, runRoomBinding.version,
                runRoomBinding.roomId,
                runRoomBinding.participantIdAtBind].join(":"),
            );
            verifiedClaims.set(
              `retained_runtime\n${args.run_ref}`,
              runVerificationRef,
            );
            verifiedIdentity.retainedRuntime = {
              runRef: run.run_id,
              runVersion: run.version,
              runRoomBindingRef: runRoomBinding.bindingId,
              runRoomBindingVersion: runRoomBinding.version,
              verificationRef: runVerificationRef,
            };
          }
        }
        if (mutationClaim && args.room_ref && args.environment_ref && args.run_ref &&
            roomParticipantId && environmentIdentity &&
            input.principal.scopes.has(HELIX_ENVIRONMENT_ACTION_READ_SCOPE)) {
          const lease = await executionLeaseClaimReader({
            roomId: args.room_ref,
            profileId: input.principal.accountProfileId,
            actionRequestId: mutationClaim.resource_ref,
          });
          if (lease && lease.roomId === args.room_ref &&
              lease.environmentBindingId === args.environment_ref &&
              lease.runId === args.run_ref &&
              lease.participantId === roomParticipantId &&
              lease.sourceId === environmentIdentity.sourceId) {
            const leaseVerificationRef = verificationRef(
              "execution_lease",
              [lease.actionRequestId, lease.workflowId, lease.actionAuthorityId,
                lease.sourceId, lease.participantId, lease.status,
                lease.leaseExpiresAt].join(":"),
            );
            verifiedClaims.set(
              `mutation_lease_active\n${mutationClaim.resource_ref}`,
              leaseVerificationRef,
            );
            verifiedIdentity.executionLease = {
              executionLeaseRef: lease.actionRequestId,
              workflowRef: lease.workflowId,
              actionAuthorityRef: lease.actionAuthorityId,
              participantRef: lease.participantId,
              sourceRef: lease.sourceId,
              leaseExpiresAt: lease.leaseExpiresAt,
              verificationRef: leaseVerificationRef,
            };
          }
        }
        const presence = coordinationStore.registerOrHeartbeat({
          profileRef: input.principal.accountProfileId,
          accountSessionId: identity.accountSessionId,
          authenticatedMcpClientRef: identity.authenticatedClientRef,
          presence: {
            client_session_ref: identity.clientSessionRef,
            conversation_thread_ref: identity.conversationThreadRef,
            declared_objective_summary: args.declared_objective_summary,
            lifecycle_state: args.lifecycle_state,
            resource_claims: args.resource_claims,
            room_ref: args.room_ref,
            environment_ref: args.environment_ref,
            run_ref: args.run_ref,
            blocker_summary: args.blocker_summary,
            heartbeat_ttl_seconds: args.heartbeat_ttl_seconds,
          },
          verifiedResourceClaims: verifiedClaims,
          verifiedIdentity,
        });
        return { ok: true, presence, identity_basis: {
          authenticated_profile: "server_verified",
          authenticated_mcp_client: "server_verified",
          conversation_thread: "client_declared",
          client_session: "server_derived",
        }, ...localSupervisorFlags };
      }),
    );

    server.registerTool(
      "helix_local_supervisor_coordination_read",
      {
        title: "Read local multi-agent coordination",
        description: "Returns bounded presence, relays involving this exact derived client, and inert handoff/collision recommendations for one installed node.",
        inputSchema: z.object({
          client_continuation_ref: localSupervisorContinuationSchema,
          after_cursor: z.number().int().nonnegative().default(0),
        }).strict(),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        _meta: oauthToolMeta(HELIX_LOCAL_SUPERVISOR_READ_MCP_SCOPES),
      },
      async (args) => callLocalSupervisorTool(HELIX_LOCAL_SUPERVISOR_READ_MCP_SCOPES, () => {
        requireAllAgentScopes(HELIX_LOCAL_SUPERVISOR_READ_MCP_SCOPES);
        const identity = localSupervisorIdentity(args.client_continuation_ref);
        coordinationStore.authenticateClient({
          profileRef: input.principal.accountProfileId,
          accountSessionId: identity.accountSessionId,
          clientSessionRef: identity.clientSessionRef,
        });
        return {
          ok: true,
          schema: "helix.local_supervisor_mcp_coordination.v1",
          service_instance_ref: coordinationStore.serviceInstanceRef,
          requesting_client_session_ref: identity.clientSessionRef,
          presence: coordinationStore.listPresence(),
          relays: coordinationStore.listRelays({
            profileRef: input.principal.accountProfileId,
            accountSessionId: identity.accountSessionId,
            clientSessionRef: identity.clientSessionRef,
            afterCursor: args.after_cursor,
          }),
          relay_recommendations: coordinationStore.listRecommendations(),
          ...localSupervisorFlags,
        };
      }),
    );

    server.registerTool(
      "helix_local_supervisor_relay_publish",
      {
        title: "Publish an advisory relay to another local client",
        description: "Publishes bounded inert coordination text from this exact derived client. It cannot execute commands, transfer authority, restart a process, or satisfy evidence.",
        inputSchema: z.object({
          client_continuation_ref: localSupervisorContinuationSchema,
          client_message_ref: localSupervisorContinuationSchema,
          target_client_session_ref: localSupervisorContinuationSchema,
          relay_type: helixLocalSupervisorRelayTypeSchema,
          summary: z.string().trim().min(1).max(360),
          resource_ref: localSupervisorOptionalRefSchema,
          room_ref: localSupervisorOptionalRefSchema,
          run_ref: localSupervisorOptionalRefSchema,
          expires_in_seconds: z.number().int().min(15).max(600).default(180),
        }).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        _meta: oauthToolMeta(HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES),
      },
      async (args) => callLocalSupervisorTool(HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES, () => {
        requireAllAgentScopes(HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES);
        const identity = localSupervisorIdentity(args.client_continuation_ref);
        const relay = coordinationStore.publishRelay({
          profileRef: input.principal.accountProfileId,
          accountSessionId: identity.accountSessionId,
          relay: {
            client_message_ref: args.client_message_ref,
            sender_client_session_ref: identity.clientSessionRef,
            target_client_session_ref: args.target_client_session_ref,
            relay_type: args.relay_type,
            summary: args.summary,
            resource_ref: args.resource_ref,
            room_ref: args.room_ref,
            run_ref: args.run_ref,
            expires_in_seconds: args.expires_in_seconds,
          },
        });
        return { ok: true, relay, ...localSupervisorFlags };
      }),
    );

    server.registerTool(
      "helix_local_supervisor_relay_acknowledge",
      {
        title: "Acknowledge an advisory local-client relay",
        description: "Acknowledges one relay only when this exact derived client is its target; acknowledgement grants no authority.",
        inputSchema: z.object({
          client_continuation_ref: localSupervisorContinuationSchema,
          message_ref: localSupervisorContinuationSchema,
        }).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        _meta: oauthToolMeta(HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES),
      },
      async (args) => callLocalSupervisorTool(HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES, () => {
        requireAllAgentScopes(HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES);
        const identity = localSupervisorIdentity(args.client_continuation_ref);
        const relay = coordinationStore.acknowledgeRelay({
          profileRef: input.principal.accountProfileId,
          accountSessionId: identity.accountSessionId,
          messageRef: args.message_ref,
          acknowledgement: { client_session_ref: identity.clientSessionRef },
        });
        return { ok: true, relay, ...localSupervisorFlags };
      }),
    );

    server.registerTool(
      "helix_local_supervisor_presence_disconnect",
      {
        title: "Disconnect this local Codex client presence",
        description: "Releases this exact derived client's advisory presence and client-declared claims. It does not stop a process or release an independently governed execution lease.",
        inputSchema: z.object({ client_continuation_ref: localSupervisorContinuationSchema }).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        _meta: oauthToolMeta(HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES),
      },
      async (args) => callLocalSupervisorTool(HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES, () => {
        requireAllAgentScopes(HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES);
        const identity = localSupervisorIdentity(args.client_continuation_ref);
        const presence = coordinationStore.disconnect({
          profileRef: input.principal.accountProfileId,
          accountSessionId: identity.accountSessionId,
          clientSessionRef: identity.clientSessionRef,
        });
        return { ok: true, presence, ...localSupervisorFlags };
      }),
    );

    if (input.desktopMcpTunnelTransitionStore) {
      const transitionStore = input.desktopMcpTunnelTransitionStore;
      if (transitionStore.serviceInstanceRef !== coordinationStore.serviceInstanceRef) {
        throw new Error("desktop_tunnel_transition_service_epoch_mismatch");
      }
      const transitionIdentity = (
        continuationRef: string,
      ): DesktopMcpTransitionIdentity => {
        const nativeDesktopClient =
          input.principal.issuer === "urn:casimirbot:desktop-session" &&
          input.principal.oauthClientRef === null;
        const externalOAuthClient = Boolean(input.principal.oauthClientRef);
        const trustedDeveloperRequester = nativeDesktopClient
          ? input.principal.accountType === "developer"
          : externalOAuthClient && input.principal.trustedDeveloperProfile === true;
        if (
          !trustedDeveloperRequester ||
          !input.principal.accountContext.trusted_account_session ||
          (!nativeDesktopClient && !externalOAuthClient)
        ) {
          throw new DesktopMcpTunnelTransitionError(
            "transition_trusted_developer_session_required",
            403,
          );
        }
        const localIdentity = localSupervisorIdentity(continuationRef);
        const presence = coordinationStore.listPresence().find((entry) =>
          entry.client_session_ref === localIdentity.clientSessionRef);
        if (
          !presence?.active ||
          presence.conversation_thread_ref !== continuationRef ||
          presence.authenticated_mcp_client_ref !==
            localIdentity.authenticatedClientRef
        ) {
          throw new DesktopMcpTunnelTransitionError(
            "transition_active_presence_required",
            409,
          );
        }
        coordinationStore.authenticateClient({
          profileRef: input.principal.accountProfileId,
          accountSessionId: localIdentity.accountSessionId,
          clientSessionRef: localIdentity.clientSessionRef,
        });
        return {
          serviceInstanceRef: coordinationStore.serviceInstanceRef,
          clientSessionRef: localIdentity.clientSessionRef,
          conversationThreadRef: continuationRef,
          authenticatedProfileRef: input.principal.accountProfileId,
          authenticatedMcpClientRef: localIdentity.authenticatedClientRef,
          accountSessionId: input.principal.accountContext.session_id,
          clientIdentityAssurance: nativeDesktopClient
            ? "native_tunnel_client_plus_server_derived_continuation"
            : "external_oauth_client_plus_server_derived_continuation",
          independentExternalOAuthClientBound: externalOAuthClient,
        };
      };
      const transitionOutputFlags = {
        reconnect_required: true as const,
        catalog_refresh_required: true as const,
        shared_live_room_catalog_pre_advertised: true as const,
        tool_list_changed_supported: true as const,
        authority_limited_to_tunnel_transport: true as const,
        environment_authority_granted: false as const,
        trading_authority_granted: false as const,
        credential_included: false as const,
        private_endpoint_included: false as const,
        hidden_reasoning_included: false as const,
        answer_authority: false as const,
        assistant_answer: false as const,
        terminal_eligible: false as const,
      };
      const requestToolCatalogRefresh = async (): Promise<boolean> => {
        try {
          await server.server.sendToolListChanged();
          return true;
        } catch {
          // The native transport may already be reconnecting. The accepted
          // transition remains authoritative; a missed advisory notification
          // must not turn that completed native side effect into a tool error.
          return false;
        }
      };

      server.registerTool(
        "helix_desktop_tunnel_transition_request",
        {
          title: "Request a governed full MCP tunnel delegation",
          description: "Creates a pending, developer-only, short-lived tunnel transport request bound to this exact active MCP presence. A separate first-party native desktop session must approve it before execution. It cannot grant itself, start the tunnel, grant an environment capability, or become an assistant answer.",
          inputSchema: desktopMcpTransitionRequestInputSchema,
          annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
          _meta: oauthToolMeta(HELIX_DESKTOP_TUNNEL_TRANSITION_REQUEST_SCOPE),
        },
        async (args) => callLocalSupervisorTool(
          HELIX_DESKTOP_TUNNEL_TRANSITION_REQUEST_SCOPE,
          () => {
            requireAllAgentScopes([HELIX_DESKTOP_TUNNEL_TRANSITION_REQUEST_SCOPE]);
            const created = transitionStore.request({
              identity: transitionIdentity(args.client_continuation_ref),
              declaredTaskSummary: args.declared_task_summary,
              requestedLeaseSeconds: args.requested_lease_seconds,
            });
            return { ok: true, ...created, ...transitionOutputFlags };
          },
        ),
      );

      server.registerTool(
        "helix_desktop_tunnel_transition_inspect",
        {
          title: "Inspect this governed tunnel transition request",
          description: "Reads only a transition request owned by this exact active MCP presence. It returns no credentials, private endpoint, environment authority, or assistant answer.",
          inputSchema: z.object({
            client_continuation_ref: localSupervisorContinuationSchema,
            transition_request_ref: z.string().trim().min(1).max(128),
          }).strict(),
          annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
          _meta: oauthToolMeta(HELIX_DESKTOP_TUNNEL_TRANSITION_REQUEST_SCOPE),
        },
        async (args) => callLocalSupervisorTool(
          HELIX_DESKTOP_TUNNEL_TRANSITION_REQUEST_SCOPE,
          () => {
            requireAllAgentScopes([HELIX_DESKTOP_TUNNEL_TRANSITION_REQUEST_SCOPE]);
            const request = transitionStore.inspect({
              identity: transitionIdentity(args.client_continuation_ref),
              requestRef: args.transition_request_ref,
            });
            const receipts = transitionStore.listReceipts(
              args.transition_request_ref,
            );
            return {
              ok: true,
              request,
              receipts,
              receipt_chain_scope: "service_instance" as const,
              ...transitionOutputFlags,
            };
          },
        ),
      );

      server.registerTool(
        "helix_desktop_tunnel_transition_execute",
        {
          title: "Execute an already-delegated native MCP tunnel transition",
          description: "Asks the native desktop broker to transition only the MCP transport under an active user delegation. The response is a nonterminal acceptance receipt; reconnect and catalog refresh remain separate observations.",
          inputSchema: desktopMcpTransitionExecuteInputSchema,
          annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
          _meta: oauthToolMeta(HELIX_DESKTOP_TUNNEL_TRANSITION_EXECUTE_SCOPE),
        },
        async (args) => callLocalSupervisorTool(
          HELIX_DESKTOP_TUNNEL_TRANSITION_EXECUTE_SCOPE,
          async () => {
            requireAllAgentScopes([HELIX_DESKTOP_TUNNEL_TRANSITION_EXECUTE_SCOPE]);
            if (!input.desktopMcpTunnelTransitionExecutor) {
              throw new DesktopMcpTunnelTransitionError(
                "transition_native_broker_unavailable",
                503,
              );
            }
            const identity = transitionIdentity(args.client_continuation_ref);
            const delegated = transitionStore.inspect({
              identity,
              requestRef: args.transition_request_ref,
            });
            if (!delegated.delegation_ref || !delegated.delegation_expires_at) {
              throw new DesktopMcpTunnelTransitionError(
                "transition_delegation_not_active",
                409,
              );
            }
            const authorization = transitionStore.authorize({
              identity,
              requestRef: args.transition_request_ref,
              targetScope: args.target_scope,
              idempotencyKey: args.idempotency_key,
            });
            if (authorization.idempotencyReplayed) {
              const toolListChangedRequested =
                await requestToolCatalogRefresh();
              return {
                ok: true,
                accepted: true,
                receipt: authorization.receipt,
                native_receipt_ref: null,
                idempotency_replayed: true,
                native_transition_resubmitted: false,
                tool_list_changed_requested: toolListChangedRequested,
                ...transitionOutputFlags,
              };
            }
            try {
              const native = await input.desktopMcpTunnelTransitionExecutor({
                transitionRequestRef: args.transition_request_ref,
                delegationRef: delegated.delegation_ref,
                accountSessionId:
                  authorization.delegatedAccountSessionId,
                targetScope: args.target_scope,
                delegationExpiresAt: delegated.delegation_expires_at,
              });
              const toolListChangedRequested = native.accepted
                ? await requestToolCatalogRefresh()
                : false;
              return {
                ok: true,
                accepted: native.accepted,
                receipt: authorization.receipt,
                native_receipt_ref: native.nativeReceiptRef,
                idempotency_replayed: false,
                native_transition_resubmitted: true,
                tool_list_changed_requested: toolListChangedRequested,
                ...transitionOutputFlags,
              };
            } catch (error) {
              transitionStore.settle({
                requestRef: args.transition_request_ref,
                eventType: "failed",
                reasonCode: "native_transition_rejected",
              });
              throw error;
            }
          },
        ),
      );
    }
  }

  if (coordinationOnly) {
    installOAuthToolCatalogAugmentation(
      server,
      new Map<string, RequiredOAuthScopes>([
        ["helix_environment_device_check", HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
        ["helix_public_ui_catalog", HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
        ["helix_evidence_observation_get", HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
        ["helix_local_supervisor_presence_update", HELIX_LOCAL_SUPERVISOR_READ_MCP_SCOPES],
        ["helix_local_supervisor_coordination_read", HELIX_LOCAL_SUPERVISOR_READ_MCP_SCOPES],
        ["helix_local_supervisor_relay_publish", HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES],
        ["helix_local_supervisor_relay_acknowledge", HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES],
        ["helix_local_supervisor_presence_disconnect", HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES],
        ...ROOM_TRANSITION_SHADOW_TOOL_SCOPES.entries(),
        ...ENVIRONMENT_TRANSITION_SHADOW_TOOL_SCOPES.entries(),
        ...(input.desktopMcpTunnelTransitionStore ? [
          ["helix_desktop_tunnel_transition_request", [HELIX_DESKTOP_TUNNEL_TRANSITION_REQUEST_SCOPE]],
          ["helix_desktop_tunnel_transition_inspect", [HELIX_DESKTOP_TUNNEL_TRANSITION_REQUEST_SCOPE]],
          ["helix_desktop_tunnel_transition_execute", [HELIX_DESKTOP_TUNNEL_TRANSITION_EXECUTE_SCOPE]],
        ] as Array<[string, RequiredOAuthScopes]> : []),
      ]),
    );
    return server;
  }

  server.registerTool(
    "helix_client_authorization_status",
    {
      title: "Check client authorization readiness",
      description:
        "Compares this signed bearer token with one named CasimirBot capability profile. It returns only required, granted-required, and missing scope names plus expiry and a stable recovery action; it exposes no bearer, subject, OAuth client identity, raw claims, credential, mutation, or answer authority.",
      inputSchema: z.object({
        capability_profile: helixClientAuthorizationCapabilityProfileSchema,
      }).strict(),
      outputSchema: helixClientAuthorizationReadinessSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_READ_SCOPE),
    },
    async ({ capability_profile }) =>
      callRoomTool(HELIX_SHARED_LIVE_ROOM_READ_SCOPE, async () => {
        requireHelixAgentApiScope(
          input.principal,
          HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
        );
        const authorizationExpiresAt = input.principal.tokenExpiresAt?.trim();
        if (!authorizationExpiresAt) {
          throw new HelixAgentApiServiceError(
            401,
            "unauthorized",
            "The bearer token has no verified expiry.",
            false,
          );
        }
        return buildHelixClientAuthorizationReadiness({
          capabilityProfile: capability_profile,
          grantedScopes: input.principal.scopes,
          authorizationExpiresAt,
        });
      }),
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
    evidenceStore,
  });

  server.registerTool(
    "helix_environment_subject_list",
    {
      title: "List my live environment subjects",
      description:
        "Lists sanitized subject directories and this authenticated room member's current environment identity. It never exposes native player IDs, connector credentials, or answer authority.",
      inputSchema: z.object({ room_id: helixSharedLiveRoomIdSchema }).strict(),
      outputSchema: helixRoomEnvironmentsReceiptSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_READ_SCOPE),
    },
    async ({ room_id }: HelixEnvironmentSubjectListToolArguments) =>
      callRoomObservationTool(HELIX_SHARED_LIVE_ROOM_READ_SCOPE, async () => {
        requireHelixAgentApiScope(
          input.principal,
          HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
        );
        requireCurrentRoomFeature();
        const environments = await environmentSubjectService.list({
          roomId: room_id,
          profileId: input.principal.accountProfileId,
        });
        return {
          ok: true,
          value: {
            schema: "helix.room_environments.receipt.v1",
            ok: true,
            error: null,
            message: "Environment subjects listed for the authenticated room member.",
            environments,
            binding: null,
            answer_authority: false,
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
          },
        };
      }),
  );

  server.registerTool(
    "helix_environment_subject_select",
    {
      title: "Select my live environment subject",
      description:
        "Re-verifies only the authenticated room member's own exact subject from a fresh connector directory. It cannot assign another participant, expand permissions, or bypass subject conflicts and connector-epoch checks.",
      inputSchema: helixRoomEnvironmentSelfBindingRequestSchema.extend({
        room_id: helixSharedLiveRoomIdSchema,
        environment_binding_id: z.string().trim().min(1).max(320),
      }).strict(),
      outputSchema: helixRoomEnvironmentsReceiptSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_MINECRAFT_ACTION_MCP_SCOPES),
    },
    async ({
      room_id,
      environment_binding_id,
      subject_ref,
    }: HelixEnvironmentSubjectSelectToolArguments) =>
      callRoomObservationTool(HELIX_MINECRAFT_ACTION_MCP_SCOPES, async () => {
        requireAllAgentScopes(HELIX_MINECRAFT_ACTION_MCP_SCOPES);
        requireCurrentRoomFeature();
        const binding = await environmentSubjectService.select({
          roomId: room_id,
          profileId: input.principal.accountProfileId,
          environmentBindingId: environment_binding_id,
          subjectRef: subject_ref,
        });
        return {
          ok: true,
          value: {
            schema: "helix.room_environments.receipt.v1",
            ok: true,
            error: null,
            message: `Authenticated room identity re-verified as ${binding.subject_label}.`,
            binding,
            answer_authority: false,
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
          },
        };
      }),
  );

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
    "helix_environment_reasoning_role_record",
    {
      title: "Record revision-bound environment reasoning support",
      description:
        "Records one nonterminal perception, prospective-planning, or verification artifact for the exact current durable goal, observation, room participant, and principal turn. It cannot execute or answer.",
      inputSchema: helixEnvironmentReasoningRoleRecordRequestSchema.extend({
        room_id: helixSharedLiveRoomIdSchema,
        environment_binding_id: z.string().trim().min(1).max(320),
        action_authority_id: z.string().trim().min(1).max(320),
        subject_native_id: z.string().trim().min(1).max(320),
        turn_id: z.string().trim().min(1).max(320),
      }).strict(),
      outputSchema: environmentReasoningRoleOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_MINECRAFT_ACTION_MCP_SCOPES),
    },
    async (argumentsValue: HelixEnvironmentReasoningRoleRecordToolArguments) =>
      callRoomObservationTool(HELIX_MINECRAFT_ACTION_MCP_SCOPES, async () => {
        requireAllAgentScopes(HELIX_MINECRAFT_ACTION_MCP_SCOPES);
        requireCurrentRoomFeature();
        if (
          argumentsValue.payload.role_kind === "prospective_planning" &&
          !argumentsValue.payload.abstain
        ) {
          const proposedActionKind =
            typeof argumentsValue.payload.capability_arguments?.action_kind ===
            "string"
              ? argumentsValue.payload.capability_arguments.action_kind
              : "";
          const canonicalCapabilityId =
            minecraftCapabilityIdForActionKind(proposedActionKind);
          if (
            !canonicalCapabilityId ||
            canonicalCapabilityId !== argumentsValue.payload.capability_id
          ) {
            throw new EnvironmentReasoningRoleError(
              "reasoning_role_capability_identity_mismatch",
              409,
              "The prospective plan must identify the canonical Minecraft capability registered for capability_arguments.action_kind. Repair the proposal before disposition or arbitration.",
            );
          }
        }
        const participantId = await resolveSelfParticipantId(argumentsValue.room_id);
        const projection = await reasoningRoleService.recordOutput({
          ownerProfileId: input.principal.accountProfileId,
          roomId: argumentsValue.room_id,
          participantId,
          environmentBindingId: argumentsValue.environment_binding_id,
          subjectNativeId: argumentsValue.subject_native_id,
          actionAuthorityId: argumentsValue.action_authority_id,
          runId: null,
          turnId: argumentsValue.turn_id,
          goalId: argumentsValue.goal_id,
          expectedGoalRevision: argumentsValue.expected_goal_revision,
          expectedLedgerRevision: argumentsValue.expected_ledger_revision,
          observationRevision: argumentsValue.observation_revision,
          principalTurnId: argumentsValue.turn_id,
          producer: {
            selected_runtime_provider_id: "external_mcp_runtime",
            supporting_provider_id: "external_mcp_runtime",
            role_profile_id:
              `environment.${argumentsValue.payload.role_kind}.external_mcp_shadow.v1`,
            role_artifact_version: "v1",
          },
          inputEvidenceRefs: argumentsValue.input_evidence_refs,
          payload: argumentsValue.payload,
          expiresAt: new Date(
            Date.now() + argumentsValue.expires_in_seconds * 1_000,
          ).toISOString(),
        });
        return {
          ok: true,
          value: reasoningRoleMcpObservation(
            HELIX_ENVIRONMENT_REASONING_ROLE_RECORD_CAPABILITY,
            argumentsValue.room_id,
            projection,
          ),
        };
      }),
  );

  server.registerTool(
    "helix_environment_reasoning_role_inspect",
    {
      title: "Inspect revision-bound environment reasoning support",
      description:
        "Reconstructs the authorized append-only G6 role ledger as nonterminal evidence for the principal Runtime Codex.",
      inputSchema: z.object({
        room_id: helixSharedLiveRoomIdSchema,
        goal_id: z.string().trim().min(1).max(320),
      }).strict(),
      outputSchema: environmentReasoningRoleOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_READ_SCOPE),
    },
    async (argumentsValue: HelixEnvironmentReasoningRoleInspectToolArguments) =>
      callRoomObservationTool(HELIX_SHARED_LIVE_ROOM_READ_SCOPE, async () => {
        requireHelixAgentApiScope(
          input.principal,
          HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
        );
        requireCurrentRoomFeature();
        const participantId = await resolveSelfParticipantId(argumentsValue.room_id);
        const projection = await reasoningRoleService.inspect({
          goalId: argumentsValue.goal_id,
          profileId: input.principal.accountProfileId,
          participantId,
        });
        return {
          ok: true,
          value: reasoningRoleMcpObservation(
            HELIX_ENVIRONMENT_REASONING_ROLE_INSPECT_CAPABILITY,
            argumentsValue.room_id,
            projection,
          ),
        };
      }),
  );

  server.registerTool(
    "helix_environment_reasoning_role_disposition",
    {
      title: "Record principal disposition of environment reasoning support",
      description:
        "Records the exact principal turn's adoption, revision, rejection, or ignore decision. Helix hashes exact adopted arguments; no action executes.",
      inputSchema: z.object({
        room_id: helixSharedLiveRoomIdSchema,
        turn_id: z.string().trim().min(1).max(320),
        goal_id: z.string().trim().min(1).max(320),
        expected_ledger_revision: z.number().int().positive(),
        role_output_id: z.string().trim().min(1).max(320),
        disposition: z.enum(["adopted", "revised", "ignored", "rejected"]),
        adopted_capability_id: z.string().trim().min(1).max(320).nullable(),
        adopted_capability_arguments: z.record(z.string(), z.unknown()).nullable(),
        rationale_summary: z.string().trim().min(1).max(4_000),
      }).strict(),
      outputSchema: environmentReasoningRoleOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_MINECRAFT_ACTION_MCP_SCOPES),
    },
    async (argumentsValue: HelixEnvironmentReasoningRoleDispositionToolArguments) =>
      callRoomObservationTool(HELIX_MINECRAFT_ACTION_MCP_SCOPES, async () => {
        requireAllAgentScopes(HELIX_MINECRAFT_ACTION_MCP_SCOPES);
        requireCurrentRoomFeature();
        const disposition =
          helixEnvironmentReasoningRoleDispositionRequestSchema.parse({
            goal_id: argumentsValue.goal_id,
            expected_ledger_revision: argumentsValue.expected_ledger_revision,
            role_output_id: argumentsValue.role_output_id,
            disposition: argumentsValue.disposition,
            adopted_capability_id: argumentsValue.adopted_capability_id,
            adopted_capability_arguments:
              argumentsValue.adopted_capability_arguments,
            rationale_summary: argumentsValue.rationale_summary,
          });
        const participantId = await resolveSelfParticipantId(argumentsValue.room_id);
        const projection = await reasoningRoleService.recordPrincipalDisposition({
          goalId: disposition.goal_id,
          profileId: input.principal.accountProfileId,
          participantId,
          expectedLedgerRevision: disposition.expected_ledger_revision,
          roleOutputId: disposition.role_output_id,
          principalTurnId: argumentsValue.turn_id,
          disposition: disposition.disposition,
          adoptedCapabilityId: disposition.adopted_capability_id,
          adoptedCapabilityArgumentsHash:
            disposition.adopted_capability_arguments === null
              ? null
              : helixEnvironmentReasoningRoleSha256(
                  disposition.adopted_capability_arguments,
                ),
          rationaleSummary: disposition.rationale_summary,
        });
        return {
          ok: true,
          value: reasoningRoleMcpObservation(
            HELIX_ENVIRONMENT_REASONING_ROLE_DISPOSITION_CAPABILITY,
            argumentsValue.room_id,
            projection,
          ),
        };
      }),
  );

  server.registerTool(
    "helix_environment_reasoning_role_arbitrate",
    {
      title: "Arbitrate current environment reasoning support",
      description:
        "Invalidates stale outputs and selects at most one current, principal-adopted proposal for the existing action-admission path. It never executes that action.",
      inputSchema: helixEnvironmentReasoningRoleArbitrateRequestSchema.extend({
        room_id: helixSharedLiveRoomIdSchema,
        environment_binding_id: z.string().trim().min(1).max(320),
        action_authority_id: z.string().trim().min(1).max(320),
        subject_native_id: z.string().trim().min(1).max(320),
        turn_id: z.string().trim().min(1).max(320),
      }).strict(),
      outputSchema: environmentReasoningRoleOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_MINECRAFT_ACTION_MCP_SCOPES),
    },
    async (argumentsValue: HelixEnvironmentReasoningRoleArbitrateToolArguments) =>
      callRoomObservationTool(HELIX_MINECRAFT_ACTION_MCP_SCOPES, async () => {
        requireAllAgentScopes(HELIX_MINECRAFT_ACTION_MCP_SCOPES);
        requireCurrentRoomFeature();
        const participantId = await resolveSelfParticipantId(argumentsValue.room_id);
        const projection = await reasoningRoleService.arbitrate({
          ownerProfileId: input.principal.accountProfileId,
          roomId: argumentsValue.room_id,
          participantId,
          environmentBindingId: argumentsValue.environment_binding_id,
          subjectNativeId: argumentsValue.subject_native_id,
          actionAuthorityId: argumentsValue.action_authority_id,
          runId: null,
          turnId: argumentsValue.turn_id,
          goalId: argumentsValue.goal_id,
          expectedGoalRevision: argumentsValue.expected_goal_revision,
          expectedLedgerRevision: argumentsValue.expected_ledger_revision,
          observationRevision: argumentsValue.observation_revision,
          principalTurnId: argumentsValue.turn_id,
          consideredRoleOutputIds: argumentsValue.considered_role_output_ids,
          selectedRoleOutputId: argumentsValue.selected_role_output_id,
          reason: argumentsValue.reason,
        });
        return {
          ok: true,
          value: reasoningRoleMcpObservation(
            HELIX_ENVIRONMENT_REASONING_ROLE_ARBITRATE_CAPABILITY,
            argumentsValue.room_id,
            projection,
          ),
        };
      }),
  );

  server.registerTool(
    "helix_environment_action_authority_inspect",
    {
      title: "Inspect current player-action authority",
      description:
        "Lists the authenticated room member's visible Player Embodiment authorities and sanitized connector readiness for one exact environment. Credentials are never returned.",
      inputSchema: z.object({
        room_id: helixSharedLiveRoomIdSchema,
        environment_binding_id: z.string().trim().min(1).max(320),
      }).strict(),
      outputSchema: environmentActionAuthorityInspectOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_MINECRAFT_STATUS_MCP_SCOPES),
    },
    async (argumentsValue: HelixEnvironmentActionAuthorityInspectToolArguments) =>
      callRoomObservationTool(HELIX_MINECRAFT_STATUS_MCP_SCOPES, async () => {
        requireAllAgentScopes(HELIX_MINECRAFT_STATUS_MCP_SCOPES);
        requireCurrentRoomFeature();
        const inspected = await actionAuthorityInspector({
          roomId: argumentsValue.room_id,
          profileId: input.principal.accountProfileId,
          environmentBindingId: argumentsValue.environment_binding_id,
        });
        return {
          ok: true,
          value: {
            operation: "environment.action_authority.inspect",
            room_id: argumentsValue.room_id,
            environment_binding_id: argumentsValue.environment_binding_id,
            authorities: inspected.authorities,
            connector_readiness: inspected.connectorReadiness,
            content_role:
              "environment_action_authority_observation_not_assistant_answer",
            reentry_required: true,
            answer_authority: false,
            assistant_answer: false,
            terminal_eligible: false,
          },
        };
      }),
  );

  server.registerTool(
    "helix_environment_action_authority_configure",
    {
      title: "Configure current player-action authority",
      description:
        "Lets the authenticated room owner configure the same finite Player Embodiment lease exposed by the owner UI. Exact participant/player binding, adapter capability registry, autonomy mode, manual override, and expiry remain server validated; no connector credential is returned.",
      inputSchema: z.object({
        room_id: helixSharedLiveRoomIdSchema,
        environment_binding_id: z.string().trim().min(1).max(320),
        settings: helixEnvironmentActionAuthoritySettingsSchema,
      }).strict(),
      outputSchema: environmentActionAuthorityConfigureOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_MINECRAFT_ACTION_MCP_SCOPES),
    },
    async (argumentsValue: HelixEnvironmentActionAuthorityConfigureToolArguments) =>
      callRoomObservationTool(HELIX_MINECRAFT_ACTION_MCP_SCOPES, async () => {
        requireAllAgentScopes(HELIX_MINECRAFT_ACTION_MCP_SCOPES);
        requireCurrentRoomFeature();
        const authority = await actionAuthorityConfigurator({
          roomId: argumentsValue.room_id,
          ownerProfileId: input.principal.accountProfileId,
          environmentBindingId: argumentsValue.environment_binding_id,
          participantId: argumentsValue.settings.participant_id,
          domainAdapter: argumentsValue.settings.domain_adapter,
          allowedCapabilityIds:
            argumentsValue.settings.allowed_capability_ids,
          autonomyMode: argumentsValue.settings.autonomy_mode,
          manualOverridePolicy:
            argumentsValue.settings.manual_override_policy,
          expiresAt: argumentsValue.settings.expires_at,
        });
        return {
          ok: true,
          value: {
            operation: "environment.action_authority.configure",
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
    "helix_environment_command_authority_configure",
    {
      title: "Configure current world command authority",
      description:
        "Lets the authenticated room owner configure the same finite Minecraft World Authority lease exposed by the owner UI. Authority profile, autonomy mode, approved command categories, environment ownership, and expiry remain server validated. This tool does not execute a command, issue a connector credential, expose pairing material, or grant host access.",
      inputSchema: z.object({
        room_id: helixSharedLiveRoomIdSchema,
        environment_binding_id: z.string().trim().min(1).max(320),
        settings: helixEnvironmentCommandAuthoritySettingsSchema,
      }).strict(),
      outputSchema: environmentCommandAuthorityConfigureOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_MINECRAFT_COMMAND_AUTHORITY_MCP_SCOPES),
    },
    async (argumentsValue: HelixEnvironmentCommandAuthorityConfigureToolArguments) =>
      callRoomObservationTool(
        HELIX_MINECRAFT_COMMAND_AUTHORITY_MCP_SCOPES,
        async () => {
          requireAllAgentScopes(HELIX_MINECRAFT_COMMAND_AUTHORITY_MCP_SCOPES);
          requireCurrentRoomFeature();
          const configured = await commandAuthorityConfigurator({
            roomId: argumentsValue.room_id,
            ownerProfileId: input.principal.accountProfileId,
            environmentBindingId: argumentsValue.environment_binding_id,
            authorityProfile: argumentsValue.settings.authority_profile,
            autonomyMode: argumentsValue.settings.autonomy_mode,
            approvedCategories: argumentsValue.settings.approved_categories,
            expiresAt: argumentsValue.settings.expires_at,
          });
          return {
            ok: true,
            value: {
              operation: "environment.command_authority.configure",
              room_id: argumentsValue.room_id,
              authority: configured.authority,
              member_grant: configured.ownerGrant,
              content_role:
                "environment_command_authority_receipt_not_assistant_answer",
              reentry_required: true,
              answer_authority: false,
              assistant_answer: false,
              terminal_eligible: false,
            },
          };
        },
      ),
  );

  server.registerTool(
    "helix_environment_player_pair_local",
    {
      title: "Pair the same-host Minecraft player companion",
      description:
        "Creates an owner-authorized action-only pairing and stages it directly into the bounded same-host Fabric client inbox. The one-time code and connector credential never enter MCP output, model context, chat, or debug projections.",
      inputSchema: z.object({
        room_id: helixSharedLiveRoomIdSchema,
        binding_id: z.string().trim().min(1).max(320),
        action_authority_id: z.string().trim().min(1).max(320),
        credential_ttl_ms: z.number().int().min(60_000).max(30 * 24 * 60 * 60 * 1_000),
        idempotency_key: idempotencyKeySchema,
      }).strict(),
      outputSchema: environmentPlayerPairLocalOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_MINECRAFT_ACTION_MCP_SCOPES),
    },
    async (argumentsValue: HelixEnvironmentPlayerPairLocalToolArguments) =>
      callRoomObservationTool(HELIX_MINECRAFT_ACTION_MCP_SCOPES, async () => {
        requireAllAgentScopes(HELIX_MINECRAFT_ACTION_MCP_SCOPES);
        requireCurrentRoomFeature();
        const handoff = await playerPairLocalHandoff({
          roomId: argumentsValue.room_id,
          ownerProfileId: input.principal.accountProfileId,
          bindingId: argumentsValue.binding_id,
          actionAuthorityId: argumentsValue.action_authority_id,
          credentialTtlMs: argumentsValue.credential_ttl_ms,
          idempotencyKey: argumentsValue.idempotency_key,
        });
        return {
          ok: true,
          value: {
            operation: "environment.player_pair.local_handoff",
            room_id: argumentsValue.room_id,
            action_authority_id: argumentsValue.action_authority_id,
            pairing: handoff.pairing,
            handoff_status: handoff.status,
            credential_included: false,
            pairing_code_included: false,
            content_role:
              "environment_player_pairing_handoff_receipt_not_assistant_answer",
            reentry_required: true,
            answer_authority: false,
            assistant_answer: false,
            terminal_eligible: false,
          },
        };
      }),
  );

  server.registerTool(
    "helix_environment_source_pair_local",
    {
      title: "Re-pair same-host Minecraft read-only sensing",
      description:
        "Rotates only the read-only source credential for the authenticated owner's exact existing Fabric room-source binding and stages it into the fixed repository server inbox. Pairing material and connector credentials never enter MCP output, model context, chat, or debug projections. This tool grants neither World Authority nor Player Embodiment.",
      inputSchema: z.object({
        room_id: helixSharedLiveRoomIdSchema,
        binding_id: z.string().trim().min(1).max(320),
        credential_ttl_ms: z.number().int().min(60_000).max(30 * 24 * 60 * 60 * 1_000),
        idempotency_key: idempotencyKeySchema,
      }).strict(),
      outputSchema: environmentSourcePairLocalOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE),
    },
    async (argumentsValue: HelixEnvironmentSourcePairLocalToolArguments) =>
      callRoomObservationTool(
        HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE,
        async () => {
          requireHelixAgentApiScope(
            input.principal,
            HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE,
          );
          requireCurrentRoomFeature();
          const handoff = await sourcePairLocalHandoff({
            roomId: argumentsValue.room_id,
            ownerProfileId: input.principal.accountProfileId,
            bindingId: argumentsValue.binding_id,
            credentialTtlMs: argumentsValue.credential_ttl_ms,
            idempotencyKey: argumentsValue.idempotency_key,
          });
          return {
            ok: true,
            value: {
              operation: "environment.source_pair.local_handoff",
              room_id: argumentsValue.room_id,
              binding_id: argumentsValue.binding_id,
              pairing: handoff.pairing,
              handoff_status: handoff.status,
              credential_included: false,
              pairing_code_included: false,
              command_authority_granted: false,
              player_embodiment_granted: false,
              content_role:
                "environment_source_pairing_handoff_receipt_not_assistant_answer",
              reentry_required: true,
              answer_authority: false,
              assistant_answer: false,
              terminal_eligible: false,
            },
          };
        },
      ),
  );

  server.registerTool(
    "helix_environment_server_pair_local",
    {
      title: "Pair the same-host Minecraft server connector",
      description:
        "Creates an owner-authorized command-only pairing for the exact existing Fabric room-source binding and stages it into the fixed repository server inbox. The one-time code and connector credential never enter MCP output, model context, chat, or debug projections. This tool does not execute Minecraft commands or grant command authority.",
      inputSchema: z.object({
        room_id: helixSharedLiveRoomIdSchema,
        binding_id: z.string().trim().min(1).max(320),
        credential_ttl_ms: z.number().int().min(60_000).max(30 * 24 * 60 * 60 * 1_000),
        idempotency_key: idempotencyKeySchema,
      }).strict(),
      outputSchema: environmentServerPairLocalOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE),
    },
    async (argumentsValue: HelixEnvironmentServerPairLocalToolArguments) =>
      callRoomObservationTool(
        HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE,
        async () => {
          requireHelixAgentApiScope(
            input.principal,
            HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE,
          );
          requireCurrentRoomFeature();
          const handoff = await serverPairLocalHandoff({
            roomId: argumentsValue.room_id,
            ownerProfileId: input.principal.accountProfileId,
            bindingId: argumentsValue.binding_id,
            credentialTtlMs: argumentsValue.credential_ttl_ms,
            idempotencyKey: argumentsValue.idempotency_key,
          });
          return {
            ok: true,
            value: {
              operation: "environment.server_pair.local_handoff",
              room_id: argumentsValue.room_id,
              binding_id: argumentsValue.binding_id,
              pairing: handoff.pairing,
              handoff_status: handoff.status,
              credential_included: false,
              pairing_code_included: false,
              content_role:
                "environment_server_pairing_handoff_receipt_not_assistant_answer",
              reentry_required: true,
              answer_authority: false,
              assistant_answer: false,
              terminal_eligible: false,
            },
          };
        },
      ),
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
        "Requests one fresh, read-only actor-status observation through the authenticated room, selected player subject, active connector, and exact probe schema. The result also carries a separately labeled same-revision perception snapshot compatibility observation for clients whose MCP catalog has not yet refreshed; callers should still refresh their catalog to use the dedicated situation-probe tool. Both observations are evidence for Codex re-entry, never assistant answers or terminal authority.",
      inputSchema: z
        .object({
          room_id: helixSharedLiveRoomIdSchema,
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
    async ({ room_id }: HelixMinecraftActorStatusToolArguments) =>
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
            arguments: {},
            accountContext: input.principal.accountContext,
            conversationThreadId: `helix-ask:room:${room_id}`,
          });
        const perceptionDigest = crypto.randomUUID();
        const perceptionExecution: EnvironmentProbeGatewayExecution =
          await environmentProbeExecutor({
            capabilityId: HELIX_MINECRAFT_PERCEPTION_SNAPSHOT_READ_CAPABILITY,
            turnId: `mcp_environment_perception_compat_turn:${perceptionDigest}`,
            toolCallId:
              `mcp_environment_perception_compat_tool_call:${perceptionDigest}`,
            providerExecutionId:
              `mcp_environment_perception_compat_execution:${perceptionDigest}`,
            arguments: {
              horizontal_radius: 7,
              vertical_radius: 8,
            },
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
            perception_snapshot_compatibility: {
              mode: "actor_status_catalog_compatibility_v1",
              catalog_refresh_required: true,
              ok: perceptionExecution.ok,
              status: perceptionExecution.status,
              summary: perceptionExecution.summary,
              observation: perceptionExecution.observation,
            },
            answer_authority: false,
            assistant_answer: false,
            terminal_eligible: false,
          },
        };
      }),
  );

  const situationFreshnessSchema = z.number().int().min(1_000).max(120_000)
    .optional();
  const currentActorSituationProbeSchema = (kind: Extract<
    HelixMinecraftSituationProbeKind,
    "inventory" | "nearby_entities" | "hazards" | "local_map"
  >) => z.object({
    kind: z.literal(kind),
    freshness_requirement_ms: situationFreshnessSchema,
  }).strict();
  const minecraftPositionSchema = z.object({
    x: z.number().min(-30_000_000).max(30_000_000),
    y: z.number().min(-2_048).max(2_048),
    z: z.number().min(-30_000_000).max(30_000_000),
  }).strict();
  const positionSituationProbeSchema = (kind: Extract<
    HelixMinecraftSituationProbeKind,
    "line_of_sight" | "reachability"
  >) => z.object({
    kind: z.literal(kind),
    position: minecraftPositionSchema,
    freshness_requirement_ms: situationFreshnessSchema,
  }).strict();
  const situationProbeInputSchema = z.object({
    room_id: helixSharedLiveRoomIdSchema,
    monitor: z.object({
      monitor_id: z.string().trim().min(1).max(320),
      client_continuation_ref: z.string().trim().min(1).max(320),
    }).strict().optional(),
    probe: z.discriminatedUnion("kind", [
      currentActorSituationProbeSchema("inventory"),
      currentActorSituationProbeSchema("nearby_entities"),
      currentActorSituationProbeSchema("hazards"),
      currentActorSituationProbeSchema("local_map"),
      z.object({
        kind: z.literal("spatial_region"),
        horizontal_radius: z.number().int().min(1).max(7).optional(),
        vertical_radius: z.number().int().min(1).max(16).optional(),
        purpose: z.enum([
          "general",
          "structure_planning",
          "build_planning",
          "structure_verification",
          "fire_safety",
          "landing_safety",
          "movement_safety",
        ]).optional(),
        freshness_requirement_ms: situationFreshnessSchema,
      }).strict(),
      z.object({
        kind: z.literal("perception_snapshot"),
        horizontal_radius: z.number().int().min(1).max(7).optional(),
        vertical_radius: z.number().int().min(2).max(16).optional(),
        freshness_requirement_ms: situationFreshnessSchema,
      }).strict(),
      positionSituationProbeSchema("line_of_sight"),
      positionSituationProbeSchema("reachability"),
    ]),
  }).strict();
  const situationCapabilityByKind: Readonly<Record<
    HelixMinecraftSituationProbeKind,
    string
  >> = Object.freeze({
    inventory: HELIX_MINECRAFT_INVENTORY_CHECK_CAPABILITY,
    nearby_entities: HELIX_MINECRAFT_NEARBY_ENTITIES_LIST_CAPABILITY,
    hazards: HELIX_MINECRAFT_HAZARDS_SCAN_CAPABILITY,
    local_map: HELIX_MINECRAFT_LOCAL_MAP_INSPECT_CAPABILITY,
    spatial_region: HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY,
    line_of_sight: HELIX_MINECRAFT_LINE_OF_SIGHT_CHECK_CAPABILITY,
    reachability: HELIX_MINECRAFT_REACHABILITY_CHECK_CAPABILITY,
    perception_snapshot: HELIX_MINECRAFT_PERCEPTION_SNAPSHOT_READ_CAPABILITY,
  });

  server.registerTool(
    "helix_minecraft_situation_probe",
    {
      title: "Inspect the selected Minecraft player's situation",
      description:
        "Requests one authenticated read-only inventory, nearby-entity, hazard, local-map, bounded spatial-region, same-revision perception-snapshot, exact line-of-sight, or geometric-reachability observation for the selected player. Local-map, spatial-region, and perception results cover only their declared bounds. Reachability is straight-line distance evidence and never proves a navigable or safe path. The result is evidence for Codex re-entry, never an assistant answer or terminal authority.",
      inputSchema: situationProbeInputSchema,
      outputSchema: minecraftSituationProbeOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
      _meta: oauthToolMeta(HELIX_MINECRAFT_STATUS_MCP_SCOPES),
    },
    async ({ room_id, monitor, probe }: HelixMinecraftSituationProbeToolArguments) =>
      callRoomObservationTool(HELIX_MINECRAFT_STATUS_MCP_SCOPES, async () => {
        requireAllAgentScopes(HELIX_MINECRAFT_STATUS_MCP_SCOPES);
        requireCurrentRoomFeature();
        const digest = crypto.randomUUID();
        const { kind, ...probeArguments } = probe;
        const execution: EnvironmentProbeGatewayExecution =
          await environmentProbeExecutor({
            capabilityId: situationCapabilityByKind[kind],
            turnId: `mcp_environment_probe_turn:${digest}`,
            toolCallId: `mcp_environment_probe_tool_call:${digest}`,
            providerExecutionId: `mcp_environment_probe_execution:${digest}`,
            arguments:
              kind === "line_of_sight" || kind === "reachability"
                ? { ...probeArguments, target: "position" }
                : probeArguments,
            accountContext: input.principal.accountContext,
            conversationThreadId: `helix-ask:room:${room_id}`,
          });
        let monitorProjection: {
          disposition: "not_requested" | "projected" | "unchanged";
          monitor_id: string | null;
          evidence_ref: string | null;
        } = {
          disposition: "not_requested",
          monitor_id: null,
          evidence_ref: null,
        };
        if (monitor && kind !== "perception_snapshot") {
          throw new EnvironmentMonitorStoreError(
            "monitor_identity_mismatch",
            409,
            "Only a same-revision perception_snapshot may be projected into the semantic monitor.",
          );
        }
        if (monitor && execution.ok && kind === "perception_snapshot") {
          const lease = await monitorService.inspect(monitorAccess(monitor));
          if (lease.identity.room_id !== room_id) {
            throw new EnvironmentMonitorStoreError(
              "monitor_identity_mismatch",
              409,
              "The perception snapshot room does not match the exact monitor identity.",
            );
          }
          const observation = execution.observation as RecordLike;
          const result = observation.result as RecordLike | undefined;
          const fingerprint = typeof result?.semantic_fingerprint === "string"
            ? result.semantic_fingerprint
            : "";
          const observationRevision = Number(
            result?.observation_revision ?? observation.observation_revision,
          );
          if (
            result?.snapshot_schema !== "helix.minecraft_perception_snapshot.v1" ||
            !/^sha256:[a-f0-9]{64}$/u.test(fingerprint) ||
            !Number.isInteger(observationRevision) ||
            observationRevision < 0
          ) {
            throw new EnvironmentMonitorStoreError(
              "monitor_run_unavailable",
              409,
              "The connector did not return a provenance-ready perception snapshot.",
            );
          }
          const priorMail = listStagePlayLiveSourceMailItems({
            threadId: `helix-ask:room:${room_id}`,
            roomId: room_id,
            sourceId: lease.identity.source_id,
            sourceKind: "minecraft_world_event",
            limit: 250,
          });
          const latest = priorMail.at(-1);
          const digestId =
            `environment_perception_snapshot:${observationRevision}:` +
            fingerprint.slice(7, 39);
          if (latest?.environmentIdentity?.digestHash === fingerprint) {
            monitorProjection = {
              disposition: "unchanged",
              monitor_id: lease.monitor_id,
              evidence_ref: latest.environmentIdentity.digestId,
            };
          } else {
            const actor = (result.actor ?? {}) as RecordLike;
            const inventory = (result.inventory ?? {}) as RecordLike;
            const focus = (result.focus ?? {}) as RecordLike;
            const uiState = (result.ui_state ?? {}) as RecordLike;
            const worldRules = (result.world_rules ?? {}) as RecordLike;
            const hazards = Array.isArray(result.hazards) ? result.hazards : [];
            const summaryText = JSON.stringify({
              schema: "helix.minecraft_perception_snapshot_mail_bridge.v1",
              changed_fields: [
                "actor.perception",
                "inventory.snapshot",
                "hazards.directional",
                "focus.current",
                "screen.state",
                "movement.coverage",
                "world.rules",
              ],
              semantic_state: {
                semantic_event_types: ["perception.snapshot.changed"],
                health: actor.health ?? null,
                item_count: inventory.item_count ?? null,
                hazard_count: hazards.length,
                focus_kind: focus.kind ?? "unknown",
                client_screen_state: uiState.client_screen_state ?? "unobserved",
                keep_inventory: worldRules.keep_inventory ?? null,
                semantic_fingerprint: fingerprint,
              },
              snapshot_evidence_ref: observation.evidence_ref,
              raw_snapshot_included: false,
              answer_authority: false,
              assistant_answer: false,
              terminal_eligible: false,
            });
            const observedAt = typeof observation.observed_at === "string"
              ? observation.observed_at
              : new Date().toISOString();
            enqueueStagePlayLiveSourceMailItem({
              threadId: `helix-ask:room:${room_id}`,
              roomId: room_id,
              environmentId: lease.identity.environment_binding_id,
              sourceId: lease.identity.source_id,
              sourceKind: "minecraft_world_event",
              environmentIdentity: {
                producerPlane: "player_embodiment",
                roomSourceBindingId: lease.identity.environment_binding_id,
                worldId: lease.identity.world_id,
                producerEpochRef: lease.identity.producer_epoch_ref,
                subjectRef: lease.identity.subject_ref,
                participantId: lease.identity.participant_id,
                selectedPlayerRef: lease.identity.subject_ref,
                selectedPlayerNativeId: null,
                observationRevision,
                digestId,
                digestHash: fingerprint,
                provenanceValid: true,
              },
              evidenceRef: digestId,
              observationRef: String(observation.evidence_ref),
              sourceHash: fingerprint,
              dedupeKey: digestId,
              sourceIdentityKey:
                `${lease.identity.subject_ref}:${observationRevision}`,
              summaryText,
              summaryPreview:
                `Minecraft perception changed: ${hazards.length} bounded hazards; ` +
                `focus ${String(focus.kind ?? "unknown")}; screen ` +
                `${String(uiState.client_screen_state ?? "unobserved")}.`,
              confidence: 0.95,
              deterministicChangeHint: "summary_changed",
              sourceFreshness: "fresh",
              evidenceRefs: [
                String(observation.evidence_ref),
                lease.identity.subject_ref,
                lease.identity.producer_epoch_ref,
              ],
              createdAt: observedAt,
            });
            monitorProjection = {
              disposition: "projected",
              monitor_id: lease.monitor_id,
              evidence_ref: digestId,
            };
          }
        }
        return {
          ok: execution.ok,
          value: {
            operation: "minecraft.situation.probe",
            probe_kind: kind,
            room_id,
            ok: execution.ok,
            status: execution.status,
            summary: execution.summary,
            observation: execution.observation,
            monitor_projection: monitorProjection,
            answer_authority: false,
            assistant_answer: false,
            terminal_eligible: false,
          },
        };
      }),
  );

  server.registerTool(
    "helix_environment_monitor_create",
    {
      title: "Create an environment semantic monitor",
      description:
        "Creates a finite read-only monitor for the authenticated OAuth client, its exact continuation, and one durable environment run the profile may read. Authority identity is derived from server state; the tool grants no Minecraft mutation or answer authority.",
      inputSchema: z.object({
        room_id: helixSharedLiveRoomIdSchema,
        goal_id: z.string().trim().min(1).max(320),
        client_continuation_ref: z.string().trim().min(1).max(320)
          .regex(/^[a-zA-Z0-9:._/-]+$/u),
        event_families: z.array(z.enum(HELIX_ENVIRONMENT_MONITOR_EVENT_FAMILIES))
          .min(1).max(HELIX_ENVIRONMENT_MONITOR_EVENT_FAMILIES.length),
        max_event_age_ms: z.number().int().min(100).max(300_000).default(120_000),
        wake_budget_total: z.number().int().min(1).max(10_000).default(64),
        expires_in_seconds: z.number().int().min(30).max(3_600).default(900),
      }).strict(),
      outputSchema: environmentMonitorLeaseOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_MINECRAFT_STATUS_MCP_SCOPES),
    },
    async (argumentsValue: HelixEnvironmentMonitorCreateToolArguments) =>
      callRoomTool(HELIX_MINECRAFT_STATUS_MCP_SCOPES, async () => {
        requireAllAgentScopes(HELIX_MINECRAFT_STATUS_MCP_SCOPES);
        requireCurrentRoomFeature();
        const participantId = await resolveSelfParticipantId(argumentsValue.room_id);
        const goal = await durableGoalService.inspect({
          goalId: argumentsValue.goal_id,
          profileId: input.principal.accountProfileId,
          participantId,
        });
        if (
          goal.identity.room_id !== argumentsValue.room_id ||
          !goal.identity.run_id
        ) {
          throw new EnvironmentMonitorStoreError(
            "monitor_identity_mismatch",
            409,
            "The monitor must bind the authenticated participant to one exact authorized durable run.",
          );
        }
        const tokenExpiresMs = Date.parse(input.principal.tokenExpiresAt ?? "");
        const now = new Date();
        if (!Number.isFinite(tokenExpiresMs) || tokenExpiresMs <= now.getTime()) {
          throw new EnvironmentMonitorStoreError(
            "monitor_run_unavailable",
            409,
            "The monitor cannot outlive an absent or expired MCP authorization.",
          );
        }
        const expiresAt = new Date(Math.min(
          tokenExpiresMs,
          now.getTime() + argumentsValue.expires_in_seconds * 1_000,
        )).toISOString();
        const identity: HelixEnvironmentMonitorIdentity = {
          owner_profile_id: input.principal.accountProfileId,
          mcp_client_id: requireMonitorClientRef(),
          client_continuation_ref: argumentsValue.client_continuation_ref,
          run_id: goal.identity.run_id,
          goal_id: goal.goal_id,
          room_id: goal.identity.room_id,
          participant_id: participantId,
          environment_binding_id: goal.identity.environment_binding_id,
          source_id: goal.identity.source_id,
          world_id: goal.identity.world_id,
          subject_ref: goal.identity.subject_binding_id,
          producer_epoch_ref: goal.identity.producer_epoch_ref,
          policy_revision: goal.identity.authority_policy_version,
        };
        const lease = await monitorService.create({
          identity,
          eventFamilies: argumentsValue.event_families,
          maxEventAgeMs: argumentsValue.max_event_age_ms,
          wakeBudgetTotal: argumentsValue.wake_budget_total,
          expiresAt,
        });
        return monitorOutput("environment.monitor.create", lease);
      }),
  );

  server.registerTool(
    "helix_environment_monitor_inspect",
    {
      title: "Inspect an environment semantic monitor",
      description:
        "Returns the credential-free finite lease and cursor state for this exact OAuth client continuation.",
      inputSchema: z.object({
        monitor_id: z.string().trim().min(1).max(320),
        client_continuation_ref: z.string().trim().min(1).max(320),
      }).strict(),
      outputSchema: environmentMonitorLeaseOutputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      _meta: oauthToolMeta(HELIX_MINECRAFT_STATUS_MCP_SCOPES),
    },
    async (argumentsValue: HelixEnvironmentMonitorAccessToolArguments) =>
      callRoomTool(HELIX_MINECRAFT_STATUS_MCP_SCOPES, async () => {
        requireAllAgentScopes(HELIX_MINECRAFT_STATUS_MCP_SCOPES);
        return monitorOutput(
          "environment.monitor.inspect",
          await monitorService.inspect(monitorAccess(argumentsValue)),
        );
      }),
  );

  server.registerTool(
    "helix_environment_monitor_read",
    {
      title: "Read or briefly wait for semantic monitor evidence",
      description:
        "Returns the oldest unacknowledged compact semantic batch, one new admitted batch, or a typed bounded-wait disposition. It never streams raw ticks or wakes a different continuation.",
      inputSchema: z.object({
        monitor_id: z.string().trim().min(1).max(320),
        client_continuation_ref: z.string().trim().min(1).max(320),
        timeout_ms: z.number().int().min(0).max(10_000).default(0),
        limit: z.number().int().min(1).max(20).default(10),
      }).strict(),
      outputSchema: environmentMonitorReadOutputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      _meta: oauthToolMeta(HELIX_MINECRAFT_STATUS_MCP_SCOPES),
    },
    async (argumentsValue: HelixEnvironmentMonitorReadToolArguments) =>
      callRoomTool(HELIX_MINECRAFT_STATUS_MCP_SCOPES, async () => {
        requireAllAgentScopes(HELIX_MINECRAFT_STATUS_MCP_SCOPES);
        requireCurrentRoomFeature();
        const result = await monitorSemanticSource.readOrWait({
          ...monitorAccess(argumentsValue),
          timeoutMs: argumentsValue.timeout_ms,
          limit: argumentsValue.limit,
        });
        return {
          operation: "environment.monitor.read",
          ...result,
          credential_included: false,
          raw_events_included: false,
          content_role: "environment_monitor_delivery_not_assistant_answer",
          reentry_required: true,
          answer_authority: false,
          assistant_answer: false,
          terminal_eligible: false,
        };
      }),
  );

  server.registerTool(
    "helix_environment_monitor_acknowledge",
    {
      title: "Acknowledge an environment monitor cursor",
      description:
        "Monotonically acknowledges an already delivered cursor for this exact OAuth client continuation; it performs no environment action.",
      inputSchema: z.object({
        monitor_id: z.string().trim().min(1).max(320),
        client_continuation_ref: z.string().trim().min(1).max(320),
        cursor: z.number().int().min(0),
      }).strict(),
      outputSchema: environmentMonitorLeaseOutputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      _meta: oauthToolMeta(HELIX_MINECRAFT_STATUS_MCP_SCOPES),
    },
    async (argumentsValue: HelixEnvironmentMonitorAcknowledgeToolArguments) =>
      callRoomTool(HELIX_MINECRAFT_STATUS_MCP_SCOPES, async () => {
        requireAllAgentScopes(HELIX_MINECRAFT_STATUS_MCP_SCOPES);
        requireCurrentRoomFeature();
        return monitorOutput(
          "environment.monitor.acknowledge",
          await monitorService.acknowledge({
            ...monitorAccess(argumentsValue),
            cursor: argumentsValue.cursor,
          }),
        );
      }),
  );

  server.registerTool(
    "helix_environment_monitor_snapshot_record",
    {
      title: "Record a fresh monitor recovery snapshot",
      description:
        "Records the exact evidence reference and observation time of a separately materialized fresh subject snapshot after a retention gap. It does not obtain or invent the snapshot.",
      inputSchema: z.object({
        monitor_id: z.string().trim().min(1).max(320),
        client_continuation_ref: z.string().trim().min(1).max(320),
        snapshot_evidence_ref: z.string().trim().min(1).max(320),
        observed_at: z.string().datetime({ offset: true }),
      }).strict(),
      outputSchema: environmentMonitorLeaseOutputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      _meta: oauthToolMeta(HELIX_MINECRAFT_STATUS_MCP_SCOPES),
    },
    async (argumentsValue: HelixEnvironmentMonitorSnapshotToolArguments) =>
      callRoomTool(HELIX_MINECRAFT_STATUS_MCP_SCOPES, async () => {
        requireAllAgentScopes(HELIX_MINECRAFT_STATUS_MCP_SCOPES);
        requireCurrentRoomFeature();
        return monitorOutput(
          "environment.monitor.snapshot_record",
          await monitorService.recordFreshSnapshot({
            ...monitorAccess(argumentsValue),
            snapshotEvidenceRef: argumentsValue.snapshot_evidence_ref,
            observedAt: argumentsValue.observed_at,
          }),
        );
      }),
  );

  server.registerTool(
    "helix_environment_monitor_revoke",
    {
      title: "Revoke an environment semantic monitor",
      description:
        "Revokes only this exact profile/client/continuation monitor lease. Later delivery and acknowledgement fail closed.",
      inputSchema: z.object({
        monitor_id: z.string().trim().min(1).max(320),
        client_continuation_ref: z.string().trim().min(1).max(320),
      }).strict(),
      outputSchema: environmentMonitorLeaseOutputSchema,
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
      _meta: oauthToolMeta(HELIX_MINECRAFT_STATUS_MCP_SCOPES),
    },
    async (argumentsValue: HelixEnvironmentMonitorAccessToolArguments) =>
      callRoomTool(HELIX_MINECRAFT_STATUS_MCP_SCOPES, async () => {
        requireAllAgentScopes(HELIX_MINECRAFT_STATUS_MCP_SCOPES);
        return monitorOutput(
          "environment.monitor.revoke",
          await monitorService.revoke(monitorAccess(argumentsValue)),
        );
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
    "helix_brokerage_robinhood_read",
    {
      title: "Read a private-room Robinhood observation",
      description:
        "Runs one reviewed Robinhood read tool for the authenticated developer's profile-owned connection and exact private room. Output is credential-free, nonterminal evidence for Codex re-entry; it cannot review, approve, place, cancel, or reconcile an order.",
      inputSchema: z.object({
        room_id: helixSharedLiveRoomIdSchema,
        connection_id: z.string().trim().min(1).max(320)
          .regex(/^[a-zA-Z0-9:._/-]+$/u).optional(),
        upstream_tool: z.enum(HELIX_ROBINHOOD_READ_ONLY_UPSTREAM_TOOLS),
        upstream_arguments: jsonObjectSchema.optional(),
      }).strict(),
      outputSchema: brokerageReadOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
      _meta: oauthToolMeta(HELIX_BROKERAGE_READ_MCP_SCOPES),
    },
    async ({
      room_id,
      connection_id,
      upstream_tool,
      upstream_arguments,
    }: HelixBrokerageReadToolArguments) =>
      callRoomObservationTool(HELIX_BROKERAGE_READ_MCP_SCOPES, async () => {
        requireAllAgentScopes(HELIX_BROKERAGE_READ_MCP_SCOPES);
        requireCurrentRoomFeature();
        const execution: BrokerageReadGatewayExecution =
          await brokerageReadExecutor({
            arguments: {
              ...(connection_id ? { connection_id } : {}),
              upstream_tool,
              upstream_arguments: upstream_arguments ?? {},
            },
            accountContext: input.principal.accountContext,
            conversationThreadId: `helix-ask:room:${room_id}`,
          });
        return {
          ok: execution.ok,
          value: {
            operation: "brokerage.robinhood.read",
            room_id,
            source_binding_id: execution.sourceBindingId ?? null,
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
    "helix_brokerage_robinhood_read_acceptance",
    {
      title: "Verify the private-room Robinhood read connection",
      description:
        "Runs the fixed five-read Robinhood acceptance set for the exact profile-owned connection and private room. The server resolves the encrypted Agentic account reference internally and returns only observation IDs and hashes. It calls no provider order tool, grants no live authority, and exposes no account number, credential, or raw provider payload.",
      inputSchema: z.object({
        room_id: helixSharedLiveRoomIdSchema,
        connection_id: z.string().trim().min(1).max(320),
        quote_probe_symbol: z.string().trim().toUpperCase()
          .regex(/^[A-Z][A-Z0-9.-]{0,9}$/u),
      }).strict(),
      outputSchema: brokerageReadAcceptanceOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
      _meta: oauthToolMeta(HELIX_BROKERAGE_READ_MCP_SCOPES),
    },
    async (argumentsValue: HelixBrokerageReadAcceptanceToolArguments) =>
      callRoomObservationTool(HELIX_BROKERAGE_READ_MCP_SCOPES, async () => {
        requireAllAgentScopes(HELIX_BROKERAGE_READ_MCP_SCOPES);
        requireCurrentRoomFeature();
        const receipt = await brokerageReadAcceptanceRunner({
          ownerProfileId: input.principal.accountProfileId,
          connectionId: argumentsValue.connection_id,
          roomId: argumentsValue.room_id,
          quoteProbeSymbol: argumentsValue.quote_probe_symbol,
        });
        return {
          ok: true,
          value: {
            operation: "brokerage.robinhood.read_acceptance",
            receipt,
            content_role:
              "brokerage_read_acceptance_receipt_not_assistant_answer",
            reentry_required: true,
            answer_authority: false,
            assistant_answer: false,
            terminal_eligible: false,
          },
        };
      }),
  );

  server.registerTool(
    "helix_brokerage_live_acceptance_readiness",
    {
      title: "Inspect Robinhood attended-live acceptance readiness",
      description:
        "Reads the exact profile-owned private-room qualification gates for the production-gated tiny-live cash-equity path. This tool is local and read-only: it never calls a Robinhood order tool, never enables live flags, never arms trading, and never exposes credentials, account numbers, or raw provider payloads.",
      inputSchema: z.object({
        room_id: helixSharedLiveRoomIdSchema,
        connection_id: z.string().trim().min(1).max(320),
      }).strict(),
      outputSchema: brokerageLiveAcceptanceReadinessOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_BROKERAGE_READ_MCP_SCOPES),
    },
    async (argumentsValue: HelixBrokerageLiveAcceptanceReadinessToolArguments) =>
      callRoomObservationTool(HELIX_BROKERAGE_READ_MCP_SCOPES, async () => {
        requireAllAgentScopes(HELIX_BROKERAGE_READ_MCP_SCOPES);
        requireCurrentRoomFeature();
        const readiness = await brokerageLiveAcceptanceReadinessReader({
          ownerProfileId: input.principal.accountProfileId,
          connectionId: argumentsValue.connection_id,
          roomId: argumentsValue.room_id,
        });
        return {
          ok: true,
          value: {
            operation: "brokerage.robinhood.live_acceptance_readiness",
            readiness,
            content_role:
              "brokerage_live_acceptance_readiness_not_assistant_answer",
            reentry_required: true,
            answer_authority: false,
            assistant_answer: false,
            terminal_eligible: false,
          },
        };
      }),
  );

  server.registerTool(
    "helix_brokerage_robinhood_room_bind",
    {
      title: "Attach Robinhood read capabilities to a private room",
      description:
        "Idempotently attaches the authenticated profile's existing Robinhood connection and selected read-only capabilities to one account-owned private room. It cannot add provider mutation capabilities, place or cancel an order, or expose credentials or account numbers.",
      inputSchema: z.object({
        room_id: helixSharedLiveRoomIdSchema,
        connection_id: z.string().trim().min(1).max(320),
        capability_ids: z.array(
          z.enum(HELIX_ROBINHOOD_READ_CAPABILITY_IDS),
        ).min(1).max(HELIX_ROBINHOOD_READ_CAPABILITY_IDS.length).optional(),
      }).strict(),
      outputSchema: brokerageRoomBindOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_BROKERAGE_ROOM_BIND_MCP_SCOPES),
    },
    async (argumentsValue: HelixBrokerageRoomBindToolArguments) =>
      callRoomTool(HELIX_BROKERAGE_ROOM_BIND_MCP_SCOPES, async () => {
        requireAllAgentScopes(HELIX_BROKERAGE_ROOM_BIND_MCP_SCOPES);
        requireCurrentRoomFeature();
        const binding = await brokerageRoomBinder({
          ownerProfileId: input.principal.accountProfileId,
          connectionId: argumentsValue.connection_id,
          roomId: argumentsValue.room_id,
          ...(argumentsValue.capability_ids
            ? { capabilityIds: [...argumentsValue.capability_ids] }
            : {}),
        });
        return {
          operation: "brokerage.robinhood.room_bind",
          binding,
          credential_included: false,
          provider_mutation_attempted: false,
          live_order_execution_enabled: false,
          content_role:
            "brokerage_room_binding_receipt_not_assistant_answer",
          reentry_required: true,
          answer_authority: false,
          assistant_answer: false,
          terminal_eligible: false,
        };
      }),
  );

  server.registerTool(
    "helix_brokerage_resident_observer_bootstrap",
    {
      title: "Bootstrap a Robinhood resident paper observer",
      description:
        "Idempotently creates or reuses one room-scoped paper account and one brokerage-native durable monitor goal bound to the authenticated profile, private Robinhood read binding, connection producer epoch, owner-scoped durable run, and paper account. It performs no provider mutation, creates no live order, and grants no live-trading authority.",
      inputSchema: z.object({
        room_id: helixSharedLiveRoomIdSchema,
        connection_id: z.string().trim().min(1).max(320),
        run_id: z.string().trim().min(1).max(320),
        turn_id: z.string().trim().min(1).max(320),
        starting_equity_cents: z.number().int().min(1).max(100_000_000),
      }).strict(),
      outputSchema: brokerageResidentBootstrapOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_BROKERAGE_RESIDENT_BOOTSTRAP_MCP_SCOPES),
    },
    async (argumentsValue: HelixBrokerageResidentBootstrapToolArguments) =>
      callRoomTool(
        HELIX_BROKERAGE_RESIDENT_BOOTSTRAP_MCP_SCOPES,
        async () => {
          requireAllAgentScopes(
            HELIX_BROKERAGE_RESIDENT_BOOTSTRAP_MCP_SCOPES,
          );
          requireCurrentRoomFeature();
          const participantId = await resolveSelfParticipantId(
            argumentsValue.room_id,
          );
          const result = await brokerageResidentBootstrapper({
            ownerProfileId: input.principal.accountProfileId,
            roomId: argumentsValue.room_id,
            participantId,
            connectionId: argumentsValue.connection_id,
            runId: argumentsValue.run_id,
            turnId: argumentsValue.turn_id,
            startingEquityCents: argumentsValue.starting_equity_cents,
          });
          return {
            operation: "brokerage.resident_observer.bootstrap",
            room_id: argumentsValue.room_id,
            idempotency_replayed: result.idempotencyReplayed,
            paper_account: result.paperAccount,
            goal: result.goal,
            credential_included: false,
            provider_mutation_attempted: false,
            live_order_execution_enabled: false,
            content_role:
              "brokerage_resident_bootstrap_receipt_not_assistant_answer",
            reentry_required: true,
            answer_authority: false,
            assistant_answer: false,
            terminal_eligible: false,
          };
        },
      ),
  );

  server.registerTool(
    "helix_brokerage_paper_observer_process",
    {
      title: "Process one admitted Robinhood quote in the paper observer",
      description:
        "Processes one already-stored fresh quote through the exact profile-owned paper account and projects only material simulated state into an existing durable semantic monitor. This locally mutates paper simulation state, never calls a Robinhood mutation tool, never places or cancels a live order, and never has answer or terminal authority.",
      inputSchema: z.object({
        room_id: helixSharedLiveRoomIdSchema,
        connection_id: z.string().trim().min(1).max(320),
        paper_account_id: z.string().trim().min(1).max(320),
        monitor_id: z.string().trim().min(1).max(320),
        client_continuation_ref: z.string().trim().min(1).max(320)
          .regex(/^[a-zA-Z0-9:._/-]+$/u),
        observation_id: z.string().trim().min(1).max(320),
        symbol: z.string().trim().toUpperCase()
          .regex(/^[A-Z][A-Z0-9.-]{0,9}$/u),
      }).strict(),
      outputSchema: brokeragePaperObserverOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_BROKERAGE_PAPER_OBSERVER_MCP_SCOPES),
    },
    async (argumentsValue: HelixBrokeragePaperObserverToolArguments) =>
      callRoomTool(HELIX_BROKERAGE_PAPER_OBSERVER_MCP_SCOPES, async () => {
        requireAllAgentScopes(HELIX_BROKERAGE_PAPER_OBSERVER_MCP_SCOPES);
        requireCurrentRoomFeature();
        const clientRef = requireMonitorClientRef();
        const receipt: HelixBrokerageMarketObserverReceipt =
          await brokerageObserverRunner({
            ownerProfileId: input.principal.accountProfileId,
            connectionId: argumentsValue.connection_id,
            roomId: argumentsValue.room_id,
            paperAccountId: argumentsValue.paper_account_id,
            monitorLeaseId: argumentsValue.monitor_id,
            observationId: argumentsValue.observation_id,
            symbol: argumentsValue.symbol,
          });
        const projected = await brokerageObserverSemanticSource.deliver({
          profileId: input.principal.accountProfileId,
          mcpClientId: clientRef,
          clientContinuationRef: argumentsValue.client_continuation_ref,
          receipt,
        });
        const disposition = projected.delivery
          ? projected.duplicate_evidence_refs.includes(receipt.observer_cycle_id)
            ? "duplicate"
            : "delivered"
          : "no_material_change";
        return {
          operation: "brokerage.paper_observer.process",
          room_id: argumentsValue.room_id,
          receipt,
          monitor_projection: {
            disposition,
            delivery: projected.delivery,
            duplicate_evidence_refs: projected.duplicate_evidence_refs,
          },
          credential_included: false,
          provider_mutation_attempted: false,
          live_order_execution_enabled: false,
          content_role:
            "brokerage_paper_observer_receipt_not_assistant_answer",
          reentry_required: true,
          answer_authority: false,
          assistant_answer: false,
          terminal_eligible: false,
        };
      }),
  );

  server.registerTool(
    "helix_minecraft_player_action",
    {
      title: "Execute a typed Minecraft player action",
      description:
        "Executes one bounded typed action or an admitted concurrent guardian program through the exact room, participant/player binding, Fabric action authority, live manifest, lease, resource locks, and manual-override policy. For perception-guided play, pass the exact fresh semantic_fingerprint: the harness derives a stable action identity so the same action against unchanged perception cannot become a second physical effect merely by changing the caller's idempotency key. It does not accept raw server commands, shell, files, credentials, pairing material, or embedded model code. The returned observation must re-enter Codex before any answer is written.",
      inputSchema: z
        .object({
          room_id: helixSharedLiveRoomIdSchema,
          idempotency_key: idempotencyKeySchema,
          perception_semantic_fingerprint: z.string()
            .regex(/^sha256:[a-f0-9]{64}$/u).optional(),
          principal_turn_id: z.string().trim().min(1).max(320).optional(),
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
      perception_semantic_fingerprint,
      principal_turn_id,
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
        const effectiveIdempotencyKey = perception_semantic_fingerprint
          ? [
              "perception",
              perception_semantic_fingerprint.slice("sha256:".length),
              helixEnvironmentReasoningRoleSha256(action).slice("sha256:".length),
            ].join(":")
          : idempotency_key;
        const digest = minecraftMcpIdentityDigest({
          principal: input.principal,
          idempotencyKey: effectiveIdempotencyKey,
        });
        const actionArguments = normalizeMinecraftMcpActionArguments(action);
        const execution: EnvironmentActionGatewayExecution =
          await environmentActionExecutor({
            capabilityId,
            turnId: principal_turn_id ?? `mcp_environment_turn:${digest}`,
            toolCallId: `mcp_environment_tool_call:${digest}`,
            providerExecutionId: `mcp_environment_execution:${digest}`,
            arguments: {
              ...actionArguments,
              ...(environment_label ? { environment_label } : {}),
            },
            accountContext: input.principal.accountContext,
            conversationThreadId: `helix-ask:room:${room_id}`,
          });
        if (
          execution.ok &&
          execution.status === "completed" &&
          principal_turn_id
        ) {
          const participantId = await resolveSelfParticipantId(room_id);
          await reasoningRoleService.linkCompletedPrincipalExecution({
            profileId: input.principal.accountProfileId,
            participantId,
            roomId: room_id,
            principalTurnId: principal_turn_id,
            capabilityId,
            capabilityArguments: action,
            environmentActionRequestId:
              execution.observation.action_request_ref,
            environmentActionResultRef: execution.observation.evidence_ref,
            reentryObservationRef: execution.observation.evidence_ref,
          });
        }
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
    "helix_room_floor_inspect",
    {
      title: "Inspect Shared Live Room speaking floor",
      description:
        "Reads the bounded current speaking-floor owner, epoch, and lease for one room after membership checks. Use the exact epoch for a safe release request.",
      inputSchema: z.object({ room_id: helixSharedLiveRoomIdSchema }).strict(),
      outputSchema: roomFloorInspectOutputSchema,
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
        return (await roomControlService.inspectFloor({
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
    "helix_room_consent_revoke",
    {
      title: "Revoke own Shared Live Room consent",
      description:
        "Idempotently disables one or more consent grants owned by the verified linked account. This authority-reducing tool rejects true values and cannot grant microphone, transcript, screen, thumbnail, or model-audio permission.",
      inputSchema: z
        .object({
          idempotency_key: idempotencyKeySchema,
          request: helixSharedLiveRoomConsentRevokeRequestSchema,
        })
        .strict(),
      outputSchema: roomConsentRevokeOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE),
    },
    async ({
      idempotency_key,
      request,
    }: HelixRoomConsentRevokeToolArguments) =>
      callRoomTool(HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE, async () => {
        requireHelixAgentApiScope(
          input.principal,
          HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
        );
        const result = await roomControlService.revokeOwnConsent({
          actor: roomActor,
          idempotencyKey: idempotency_key,
          request,
        });
        return {
          operation: "room.consent.revoke",
          idempotency_replayed: result.idempotencyReplayed,
          receipt: result.body,
        };
      }),
  );

  server.registerTool(
    "helix_room_consent_grant",
    {
      title: "Grant own Shared Live Room consent with delegation",
      description:
        "Grants only explicitly selected consent fields for the verified linked participant. Requires a short-lived, signed, one-time delegation bound to this MCP client, conversation, account session, room, capability, and exact request.",
      inputSchema: z.object({
        idempotency_key: idempotencyKeySchema,
        request: helixSharedLiveRoomConsentGrantRequestSchema,
        delegation: jsonObjectSchema,
      }).strict(),
      outputSchema: roomConsentGrantOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE),
    },
    async ({ idempotency_key, request, delegation }: HelixRoomConsentGrantToolArguments) =>
      callRoomTool(HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE, async () => {
        requireHelixAgentApiScope(input.principal, HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE);
        const delegationRef = await consumeRoomMcpDelegation({
          capabilityId: HELIX_SHARED_LIVE_ROOM_CONSENT_GRANT_CAPABILITY,
          roomId: request.room_id,
          request,
          receipt: delegation,
        });
        const result = await roomControlService.grantOwnConsent({
          actor: roomActor,
          idempotencyKey: idempotency_key,
          request,
          delegationRef,
        });
        return { operation: HELIX_SHARED_LIVE_ROOM_CONSENT_GRANT_CAPABILITY, idempotency_replayed: result.idempotencyReplayed, receipt: result.body };
      }),
  );

  server.registerTool(
    "helix_room_floor_release",
    {
      title: "Release own Shared Live Room speaking floor",
      description:
        "Releases only the verified linked participant's speaking floor for the exact inspected epoch. A stale epoch or another participant's floor is left unchanged.",
      inputSchema: z
        .object({ request: helixSharedLiveRoomFloorReleaseRequestSchema })
        .strict(),
      outputSchema: roomFloorReleaseOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE),
    },
    async ({ request }: HelixRoomFloorReleaseToolArguments) =>
      callRoomTool(HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE, async () => {
        requireHelixAgentApiScope(
          input.principal,
          HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
        );
        return (await roomControlService.releaseOwnFloor({
          actor: roomActor,
          request,
        })) as unknown as RecordLike;
      }),
  );

  server.registerTool(
    "helix_room_floor_acquire",
    {
      title: "Acquire own Shared Live Room speaking floor with delegation",
      description:
        "Acquires a bounded speaking-floor lease only for the verified linked participant. Requires a short-lived, signed, one-time delegation bound to this MCP client, conversation, account session, room, capability, and exact request.",
      inputSchema: z.object({
        idempotency_key: idempotencyKeySchema,
        request: helixSharedLiveRoomFloorAcquireRequestSchema,
        delegation: jsonObjectSchema,
      }).strict(),
      outputSchema: roomFloorAcquireOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE),
    },
    async ({ idempotency_key, request, delegation }: HelixRoomFloorAcquireToolArguments) =>
      callRoomTool(HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE, async () => {
        requireHelixAgentApiScope(input.principal, HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE);
        const delegationRef = await consumeRoomMcpDelegation({
          capabilityId: HELIX_SHARED_LIVE_ROOM_FLOOR_ACQUIRE_CAPABILITY,
          roomId: request.room_id,
          request,
          receipt: delegation,
        });
        const result = await roomControlService.acquireOwnFloor({
          actor: roomActor,
          idempotencyKey: idempotency_key,
          request,
          delegationRef,
        });
        return { operation: HELIX_SHARED_LIVE_ROOM_FLOOR_ACQUIRE_CAPABILITY, idempotency_replayed: result.idempotencyReplayed, receipt: result.body };
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
      ["helix_public_ui_catalog", HELIX_AGENT_RUN_READ_SCOPE],
      ["helix_evidence_observation_get", HELIX_AGENT_RUN_READ_SCOPE],
      ["helix_realtime_texture_pack_inspect", HELIX_AGENT_RUN_READ_SCOPE],
      ["helix_realtime_texture_pack_control", HELIX_AGENT_RUN_WRITE_SCOPE],
      ["helix_realtime_texture_pack_visual_direction_control", HELIX_AGENT_RUN_WRITE_SCOPE],
      ["helix_client_authorization_status", HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
      ["helix_run_continue", HELIX_AGENT_RUN_WRITE_SCOPE],
      ["helix_run_cancel", HELIX_AGENT_RUN_WRITE_SCOPE],
      ["helix_run_inspect", HELIX_AGENT_RUN_READ_SCOPE],
      ["helix_run_fetch_evidence", HELIX_AGENT_RUN_READ_SCOPE],
      ["helix_run_list_events", HELIX_AGENT_RUN_READ_SCOPE],
      ["helix_environment_device_check", HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
      ["helix_environment_subject_list", HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
      ["helix_environment_subject_select", HELIX_MINECRAFT_ACTION_MCP_SCOPES],
      ["helix_environment_goal_create", HELIX_MINECRAFT_ACTION_MCP_SCOPES],
      ["helix_environment_goal_inspect", HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
      ["helix_environment_goal_append", HELIX_MINECRAFT_ACTION_MCP_SCOPES],
      ["helix_environment_goal_checkpoint_hash", HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
      ["helix_environment_action_authority_inspect", HELIX_MINECRAFT_STATUS_MCP_SCOPES],
      ["helix_environment_action_authority_configure", HELIX_MINECRAFT_ACTION_MCP_SCOPES],
      ["helix_environment_command_authority_configure", HELIX_MINECRAFT_COMMAND_AUTHORITY_MCP_SCOPES],
      ["helix_environment_player_pair_local", HELIX_MINECRAFT_ACTION_MCP_SCOPES],
      ["helix_environment_source_pair_local", HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE],
      ["helix_environment_server_pair_local", HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE],
      ["helix_environment_action_authority_extend", HELIX_MINECRAFT_ACTION_MCP_SCOPES],
      ["helix_minecraft_actor_status", HELIX_MINECRAFT_STATUS_MCP_SCOPES],
      ["helix_minecraft_situation_probe", HELIX_MINECRAFT_STATUS_MCP_SCOPES],
      ["helix_environment_monitor_create", HELIX_MINECRAFT_STATUS_MCP_SCOPES],
      ["helix_environment_monitor_inspect", HELIX_MINECRAFT_STATUS_MCP_SCOPES],
      ["helix_environment_monitor_read", HELIX_MINECRAFT_STATUS_MCP_SCOPES],
      ["helix_environment_monitor_acknowledge", HELIX_MINECRAFT_STATUS_MCP_SCOPES],
      ["helix_environment_monitor_snapshot_record", HELIX_MINECRAFT_STATUS_MCP_SCOPES],
      ["helix_environment_monitor_revoke", HELIX_MINECRAFT_STATUS_MCP_SCOPES],
      ["helix_environment_semantic_wake_read", HELIX_MINECRAFT_STATUS_MCP_SCOPES],
      ["helix_brokerage_robinhood_read", HELIX_BROKERAGE_READ_MCP_SCOPES],
      ["helix_brokerage_robinhood_read_acceptance", HELIX_BROKERAGE_READ_MCP_SCOPES],
      ["helix_brokerage_live_acceptance_readiness", HELIX_BROKERAGE_READ_MCP_SCOPES],
      ["helix_brokerage_robinhood_room_bind", HELIX_BROKERAGE_ROOM_BIND_MCP_SCOPES],
      ["helix_brokerage_resident_observer_bootstrap", HELIX_BROKERAGE_RESIDENT_BOOTSTRAP_MCP_SCOPES],
      ["helix_brokerage_paper_observer_process", HELIX_BROKERAGE_PAPER_OBSERVER_MCP_SCOPES],
      ["helix_minecraft_player_action", HELIX_MINECRAFT_ACTION_MCP_SCOPES],
      ["helix_minecraft_workflow_status", HELIX_MINECRAFT_STATUS_MCP_SCOPES],
      ["helix_minecraft_workflow_control", HELIX_MINECRAFT_ACTION_MCP_SCOPES],
      ["helix_room_list", HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
      ["helix_room_inspect", HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
      ["helix_room_floor_inspect", HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
      ["helix_room_create", HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE],
      ["helix_room_presence_set", HELIX_MINECRAFT_ACTION_MCP_SCOPES],
      ["helix_room_consent_revoke", HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE],
      ["helix_room_consent_grant", HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE],
      ["helix_room_floor_release", HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE],
      ["helix_room_floor_acquire", HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE],
      ["helix_room_bind_run", HELIX_ROOM_RUN_ATTACHMENT_SCOPES],
      ["helix_room_claim_chat_binding", HELIX_ROOM_RUN_ATTACHMENT_SCOPES],
      ["helix_room_unbind_run", HELIX_ROOM_RUN_ATTACHMENT_SCOPES],
      ["helix_room_unbind_chat", HELIX_ROOM_RUN_ATTACHMENT_SCOPES],
      ["helix_room_command_request", HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE],
      ["helix_room_source_list", HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE],
      ["helix_room_source_create", HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE],
      ["helix_local_supervisor_presence_update", HELIX_LOCAL_SUPERVISOR_READ_MCP_SCOPES],
      ["helix_local_supervisor_coordination_read", HELIX_LOCAL_SUPERVISOR_READ_MCP_SCOPES],
      ["helix_local_supervisor_relay_publish", HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES],
      ["helix_local_supervisor_relay_acknowledge", HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES],
      ["helix_local_supervisor_presence_disconnect", HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES],
    ]),
  );
  return server;
};
