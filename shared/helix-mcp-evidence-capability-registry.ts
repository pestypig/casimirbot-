import { HELIX_AGENT_RUN_READ_SCOPE } from "./contracts/helix-agent-api.v1";
import {
  HELIX_MCP_EVIDENCE_CAPABILITY_DESCRIPTOR_SCHEMA,
  HELIX_MCP_EVIDENCE_OBSERVATION_SCHEMA,
  type HelixMcpEvidenceCapabilityDescriptor,
} from "./contracts/helix-mcp-evidence-capability.v1";
import { HELIX_SHARED_LIVE_ROOM_READ_SCOPE } from "./contracts/helix-shared-live-room-agent.v1";

/**
 * Provider-neutral MCP evidence descriptors adopted through MEC-2 and later.
 *
 * MEC-1 began with an empty registry so the inventory reported existing tools
 * as typed gaps instead of silently granting conformance. Add a descriptor
 * only after its account policy, real handler, observation schema, authority
 * negatives, and focused parity evidence are all named.
 */
export const HELIX_MCP_EVIDENCE_CAPABILITY_DESCRIPTORS = [
  {
    schema: HELIX_MCP_EVIDENCE_CAPABILITY_DESCRIPTOR_SCHEMA,
    capability_id: "helix.public_ui.catalog.inspect",
    capability_version: 1,
    mcp_tool_name: "helix_public_ui_catalog",
    semantic_family: "public_ui.catalog",
    handler_id: "helix.public_ui.catalog.handler",
    handler_contract_version: "helix.public_ui_agent_catalog.v1",
    admission_profiles: [
      {
        surface: "full_helix_mcp",
        account_scope: "user",
        required_oauth_scopes: [HELIX_AGENT_RUN_READ_SCOPE],
      },
      {
        surface: "device_check_mcp",
        account_scope: "user",
        required_oauth_scopes: [HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
      },
      {
        surface: "local_supervisor_coordination_mcp",
        account_scope: "user",
        required_oauth_scopes: [HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
      },
    ],
    permission_class: "read_observe",
    interaction_kind: "observe",
    effect_class: "read_only",
    confirmation_policy: "never",
    observation_schema: HELIX_MCP_EVIDENCE_OBSERVATION_SCHEMA,
    observation_retention_class: "profile_durable",
    reentry_required: true,
    terminal_support_policy: "reusable_while_fresh",
    claim_ceiling: {
      class: "metadata_only",
      description: "Supports claims about the bounded admitted public UI catalog only.",
    },
  },
  {
    schema: HELIX_MCP_EVIDENCE_CAPABILITY_DESCRIPTOR_SCHEMA,
    capability_id: "helix.environment.device_check.inspect",
    capability_version: 1,
    mcp_tool_name: "helix_environment_device_check",
    semantic_family: "environment.device_check",
    handler_id: "helix.environment.device_check.handler",
    handler_contract_version: "helix.environment_connector.device_check_list.v1",
    admission_profiles: [
      {
        surface: "full_helix_mcp",
        account_scope: "user",
        required_oauth_scopes: [HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
      },
      {
        surface: "device_check_mcp",
        account_scope: "user",
        required_oauth_scopes: [HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
      },
      {
        surface: "local_supervisor_coordination_mcp",
        account_scope: "user",
        required_oauth_scopes: [HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
      },
    ],
    permission_class: "read_observe",
    interaction_kind: "observe",
    effect_class: "read_only",
    confirmation_policy: "never",
    observation_schema: HELIX_MCP_EVIDENCE_OBSERVATION_SCHEMA,
    observation_retention_class: "profile_durable",
    reentry_required: true,
    terminal_support_policy: "reusable_while_fresh",
    claim_ceiling: {
      class: "bounded_observation",
      description: "Supports owner-scoped connector identity, freshness, and readiness claims only.",
    },
  },
  {
    schema: HELIX_MCP_EVIDENCE_CAPABILITY_DESCRIPTOR_SCHEMA,
    capability_id: "helix.mcp_evidence.observation.retrieve",
    capability_version: 1,
    mcp_tool_name: "helix_evidence_observation_get",
    semantic_family: "mcp_evidence.retrieval",
    handler_id: "helix.mcp_evidence.observation.retrieve.handler",
    handler_contract_version: "helix.mcp_evidence_retrieval.v1",
    admission_profiles: [
      {
        surface: "full_helix_mcp",
        account_scope: "user",
        required_oauth_scopes: [HELIX_AGENT_RUN_READ_SCOPE],
      },
      {
        surface: "device_check_mcp",
        account_scope: "user",
        required_oauth_scopes: [HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
      },
      {
        surface: "local_supervisor_coordination_mcp",
        account_scope: "user",
        required_oauth_scopes: [HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
      },
    ],
    permission_class: "read_observe",
    interaction_kind: "observe",
    effect_class: "read_only",
    confirmation_policy: "never",
    observation_schema: HELIX_MCP_EVIDENCE_OBSERVATION_SCHEMA,
    observation_retention_class: "profile_durable",
    reentry_required: true,
    terminal_support_policy: "reusable_while_fresh",
    claim_ceiling: {
      class: "evidence_support",
      description: "Supports re-entry of one still-valid owner-scoped MCP evidence observation only.",
    },
  },
] as const satisfies
  readonly HelixMcpEvidenceCapabilityDescriptor[];

export const getHelixMcpEvidenceCapabilityDescriptor = (
  toolName: string,
): HelixMcpEvidenceCapabilityDescriptor | null =>
  HELIX_MCP_EVIDENCE_CAPABILITY_DESCRIPTORS.find(
    (descriptor) => descriptor.mcp_tool_name === toolName,
  ) ?? null;
