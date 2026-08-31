import { z } from "zod";

export const HELIX_DESKTOP_TUNNEL_TRANSITION_REQUEST_SCOPE =
  "helix.desktop.tunnel.transition.request" as const;
export const HELIX_DESKTOP_TUNNEL_TRANSITION_EXECUTE_SCOPE =
  "helix.desktop.tunnel.transition.execute" as const;

export const HELIX_DESKTOP_TUNNEL_TRANSITION_SCHEMA =
  "helix.desktop_tunnel_transition.v1" as const;
export const HELIX_DESKTOP_TUNNEL_TRANSITION_RECEIPT_SCHEMA =
  "helix.desktop_tunnel_transition_receipt.v1" as const;

export const desktopMcpTransitionTargetSchema = z.enum([
  "full_helix_agent",
  "local_supervisor_coordination_and_device_check",
]);
export type DesktopMcpTransitionTarget = z.infer<
  typeof desktopMcpTransitionTargetSchema
>;

export const desktopMcpTransitionStatusSchema = z.enum([
  "pending_user_delegation",
  "delegated",
  "transition_accepted",
  "active",
  "returned_read_only",
  "revoked",
  "expired",
  "failed",
]);
export type DesktopMcpTransitionStatus = z.infer<
  typeof desktopMcpTransitionStatusSchema
>;

export const desktopMcpTransitionRequestInputSchema = z.object({
  client_continuation_ref: z.string().trim().min(1).max(256),
  declared_task_summary: z.string().trim().min(1).max(500),
  requested_lease_seconds: z.number().int().min(30).max(300).default(120),
}).strict();

export const desktopMcpTransitionExecuteInputSchema = z.object({
  client_continuation_ref: z.string().trim().min(1).max(256),
  transition_request_ref: z.string().trim().min(1).max(128),
  target_scope: desktopMcpTransitionTargetSchema,
  idempotency_key: z.string().trim().min(8).max(128),
}).strict();

export type DesktopMcpTransitionIdentity = Readonly<{
  serviceInstanceRef: string;
  clientSessionRef: string;
  conversationThreadRef: string;
  authenticatedProfileRef: string;
  authenticatedMcpClientRef: string;
  accountSessionId: string;
  clientIdentityAssurance:
    | "native_tunnel_client_plus_server_derived_continuation"
    | "external_oauth_client_plus_server_derived_continuation";
  independentExternalOAuthClientBound: boolean;
}>;

export type DesktopMcpTransitionClientIdentityAssurance =
  DesktopMcpTransitionIdentity["clientIdentityAssurance"];

export type DesktopMcpTransitionRequest = Readonly<{
  schema: typeof HELIX_DESKTOP_TUNNEL_TRANSITION_SCHEMA;
  transition_request_ref: string;
  service_instance_ref: string;
  client_session_ref: string;
  conversation_thread_ref: string;
  authenticated_profile_ref: string;
  authenticated_mcp_client_ref: string;
  declared_task_summary: string;
  declared_task_is_verified: false;
  requested_scope: "full_helix_agent";
  requested_lease_seconds: number;
  status: DesktopMcpTransitionStatus;
  delegation_ref: string | null;
  delegation_expires_at: string | null;
  created_at: string;
  updated_at: string;
  client_identity_assurance: DesktopMcpTransitionClientIdentityAssurance;
  independent_external_oauth_client_bound: boolean;
  authority_limited_to_tunnel_transport: true;
  environment_authority_granted: false;
  trading_authority_granted: false;
  credential_included: false;
  private_endpoint_included: false;
  content_role: "desktop_tunnel_transition_request_not_assistant_answer";
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
}>;

export type DesktopMcpTransitionReceipt = Readonly<{
  schema: typeof HELIX_DESKTOP_TUNNEL_TRANSITION_RECEIPT_SCHEMA;
  receipt_ref: string;
  sequence: number;
  transition_request_ref: string;
  delegation_ref: string | null;
  service_instance_ref: string;
  client_session_ref: string;
  event_type:
    | "requested"
    | "delegated"
    | "transition_accepted"
    | "active"
    | "returned_read_only"
    | "revoked"
    | "expired"
    | "failed";
  target_scope: DesktopMcpTransitionTarget;
  reason_code: string;
  observed_at: string;
  previous_receipt_hash: string | null;
  receipt_hash: string;
  client_identity_assurance: DesktopMcpTransitionClientIdentityAssurance;
  independent_external_oauth_client_bound: boolean;
  immutable_event: true;
  authority_limited_to_tunnel_transport: true;
  environment_authority_granted: false;
  trading_authority_granted: false;
  credential_included: false;
  private_endpoint_included: false;
  hidden_reasoning_included: false;
  content_role: "desktop_tunnel_transition_receipt_not_assistant_answer";
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
}>;
