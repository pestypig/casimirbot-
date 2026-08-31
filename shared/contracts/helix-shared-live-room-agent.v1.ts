import { z } from "zod";
import type { HelixSharedRealtimeRoom } from "../helix-shared-realtime-room";
import type { HelixSharedRealtimeRoomConsentPatch } from "../helix-shared-realtime-room";
import type {
  HelixRoomSourceBinding,
  HelixRoomSourceIngressScope,
} from "../helix-room-source-ingress";

export const HELIX_SHARED_LIVE_ROOM_AGENT_API_VERSION = "v1" as const;

export const HELIX_SHARED_LIVE_ROOM_READ_SCOPE = "helix.rooms.read" as const;
export const HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE =
  "helix.rooms.manage" as const;
export const HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE =
  "helix.room_sources.manage" as const;

export const HELIX_SHARED_LIVE_ROOM_LIST_CAPABILITY = "room.list" as const;
export const HELIX_SHARED_LIVE_ROOM_INSPECT_CAPABILITY =
  "room.inspect" as const;
export const HELIX_SHARED_LIVE_ROOM_CREATE_CAPABILITY = "room.create" as const;
export const HELIX_SHARED_LIVE_ROOM_PRESENCE_SET_CAPABILITY =
  "room.presence.set" as const;
export const HELIX_SHARED_LIVE_ROOM_CONSENT_REVOKE_CAPABILITY =
  "room.consent.revoke" as const;
export const HELIX_SHARED_LIVE_ROOM_CONSENT_GRANT_CAPABILITY =
  "room.consent.grant" as const;
export const HELIX_SHARED_LIVE_ROOM_FLOOR_INSPECT_CAPABILITY =
  "room.floor.inspect" as const;
export const HELIX_SHARED_LIVE_ROOM_FLOOR_RELEASE_CAPABILITY =
  "room.floor.release" as const;
export const HELIX_SHARED_LIVE_ROOM_FLOOR_ACQUIRE_CAPABILITY =
  "room.floor.acquire" as const;
export const HELIX_SHARED_LIVE_ROOM_SOURCE_LIST_CAPABILITY =
  "room.source.list" as const;
export const HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_CAPABILITY =
  "room.source.create" as const;
export const HELIX_SHARED_LIVE_ROOM_RUN_BIND_CAPABILITY =
  "room.run.bind" as const;
export const HELIX_SHARED_LIVE_ROOM_RUN_UNBIND_CAPABILITY =
  "room.run.unbind" as const;
export const HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_CLAIM_CAPABILITY =
  "room.chat_binding.claim" as const;
export const HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_UNBIND_CAPABILITY =
  "room.chat_binding.unbind" as const;
export const HELIX_SHARED_LIVE_ROOM_COMMAND_REQUEST_CAPABILITY =
  "room.command.request" as const;

export const HELIX_SHARED_LIVE_ROOM_LIST_RECEIPT_SCHEMA =
  "helix.shared_live_room.list_receipt.v1" as const;
export const HELIX_SHARED_LIVE_ROOM_INSPECT_RECEIPT_SCHEMA =
  "helix.shared_live_room.inspect_receipt.v1" as const;
export const HELIX_SHARED_LIVE_ROOM_CREATE_RECEIPT_SCHEMA =
  "helix.shared_live_room.create_receipt.v1" as const;
export const HELIX_SHARED_LIVE_ROOM_PRESENCE_SET_RECEIPT_SCHEMA =
  "helix.shared_live_room.presence_set_receipt.v1" as const;
export const HELIX_SHARED_LIVE_ROOM_CONSENT_REVOKE_RECEIPT_SCHEMA =
  "helix.shared_live_room.consent_revoke_receipt.v1" as const;
export const HELIX_SHARED_LIVE_ROOM_CONSENT_GRANT_RECEIPT_SCHEMA =
  "helix.shared_live_room.consent_grant_receipt.v1" as const;
export const HELIX_SHARED_LIVE_ROOM_FLOOR_INSPECT_RECEIPT_SCHEMA =
  "helix.shared_live_room.floor_inspect_receipt.v1" as const;
export const HELIX_SHARED_LIVE_ROOM_FLOOR_RELEASE_RECEIPT_SCHEMA =
  "helix.shared_live_room.floor_release_receipt.v1" as const;
export const HELIX_SHARED_LIVE_ROOM_FLOOR_ACQUIRE_RECEIPT_SCHEMA =
  "helix.shared_live_room.floor_acquire_receipt.v1" as const;
export const HELIX_SHARED_LIVE_ROOM_SOURCE_LIST_RECEIPT_SCHEMA =
  "helix.shared_live_room.source_list_receipt.v1" as const;
export const HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_RECEIPT_SCHEMA =
  "helix.shared_live_room.source_create_receipt.v1" as const;
export const HELIX_SHARED_LIVE_ROOM_CREDENTIAL_DELIVERY_SCHEMA =
  "helix.shared_live_room.credential_delivery.v1" as const;
export const HELIX_SHARED_LIVE_ROOM_RUN_BIND_RECEIPT_SCHEMA =
  "helix.shared_live_room.run_bind_receipt.v1" as const;
export const HELIX_SHARED_LIVE_ROOM_RUN_UNBIND_RECEIPT_SCHEMA =
  "helix.shared_live_room.run_unbind_receipt.v1" as const;
export const HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_CLAIM_RECEIPT_SCHEMA =
  "helix.shared_live_room.chat_binding_claim_receipt.v1" as const;
export const HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_UNBIND_RECEIPT_SCHEMA =
  "helix.shared_live_room.chat_binding_unbind_receipt.v1" as const;
export const HELIX_SHARED_LIVE_ROOM_ERROR_SCHEMA =
  "helix.shared_live_room.error.v1" as const;

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-zA-Z0-9:._/-]+$/);

export const helixSharedLiveRoomIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^shared_realtime_room:[a-zA-Z0-9._:-]+$/);

export const helixSharedLiveRoomCreateRequestSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
  })
  .strict();

export const helixSharedLiveRoomPresenceSetRequestSchema = z
  .object({
    room_id: helixSharedLiveRoomIdSchema,
    presence: z.enum(["present", "away"]),
  })
  .strict();

const revocableConsentFields = [
  "microphone_to_room",
  "microphone_to_model",
  "transcript_to_room",
  "screen_to_model",
  "screen_thumbnail_to_room",
  "model_audio_output",
] as const satisfies ReadonlyArray<keyof HelixSharedRealtimeRoomConsentPatch>;

const grantableConsentFields = revocableConsentFields;

export const helixSharedLiveRoomConsentRevokeRequestSchema = z
  .object({
    room_id: helixSharedLiveRoomIdSchema,
    consent: z
      .object(
        Object.fromEntries(
          revocableConsentFields.map((field) => [field, z.literal(false).optional()]),
        ) as Record<(typeof revocableConsentFields)[number], z.ZodOptional<z.ZodLiteral<false>>>,
      )
      .strict()
      .refine((value) => Object.values(value).some((entry) => entry === false), {
        message: "At least one consent field must be revoked.",
      }),
  })
  .strict();

export const helixSharedLiveRoomConsentGrantRequestSchema = z
  .object({
    room_id: helixSharedLiveRoomIdSchema,
    consent: z
      .object(
        Object.fromEntries(
          grantableConsentFields.map((field) => [field, z.literal(true).optional()]),
        ) as Record<(typeof grantableConsentFields)[number], z.ZodOptional<z.ZodLiteral<true>>>,
      )
      .strict()
      .refine((value) => Object.values(value).some((entry) => entry === true), {
        message: "At least one consent field must be granted.",
      }),
  })
  .strict();

export const helixSharedLiveRoomFloorReleaseRequestSchema = z
  .object({
    room_id: helixSharedLiveRoomIdSchema,
    floor_epoch: z.number().int().nonnegative(),
  })
  .strict();

export const helixSharedLiveRoomFloorAcquireRequestSchema = z
  .object({
    room_id: helixSharedLiveRoomIdSchema,
    lease_ms: z.number().int().min(1_000).max(60_000).optional(),
  })
  .strict();

export const helixSharedLiveRoomSourceCreateRequestSchema = z
  .object({
    world_id: identifierSchema.optional(),
    domain_adapter: identifierSchema.optional(),
    source_label: z.string().trim().min(1).max(120).optional(),
    ttl_ms: z
      .number()
      .int()
      .positive()
      .max(30 * 24 * 60 * 60 * 1_000)
      .optional(),
  })
  .strict();

export const helixSharedLiveRoomRunBindingRequestSchema = z
  .object({
    run_id: z
      .string()
      .trim()
      .regex(/^run_[A-Za-z0-9._:-]{8,200}$/),
    room_id: helixSharedLiveRoomIdSchema,
  })
  .strict();

export const helixSharedLiveRoomChatBindingClaimRequestSchema = z
  .object({
    run_id: z
      .string()
      .trim()
      .regex(/^run_[A-Za-z0-9._:-]{8,200}$/),
    claim_handle: z.string().trim().min(16).max(500),
  })
  .strict();

export const helixSharedLiveRoomRunBindingRevokeRequestSchema = z
  .object({
    binding_ref: z
      .string()
      .trim()
      .max(240)
      .regex(/^agent_room_binding:[A-Za-z0-9._:-]{8,200}$/),
  })
  .strict();

export const helixSharedLiveRoomChatBindingRevokeRequestSchema = z
  .object({
    binding_ref: z
      .string()
      .trim()
      .max(240)
      .regex(/^agent_chat_binding:[A-Za-z0-9._:-]{8,200}$/),
  })
  .strict();

export const helixSharedLiveRoomCredentialDeliverySchema = z
  .object({
    schema: z.literal(HELIX_SHARED_LIVE_ROOM_CREDENTIAL_DELIVERY_SCHEMA),
    claim_handle: z
      .string()
      .trim()
      .min(16)
      .max(512)
      .regex(/^[a-zA-Z0-9:._~-]+$/),
    claim_url: z.string().url().max(2_048),
    expires_at: z.string().datetime({ offset: true }),
    delivery_status: z.literal("pending_claim"),
    bearer_included: z.literal(false),
    plugin_config_included: z.literal(false),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict();

export type HelixSharedLiveRoomCreateRequest = z.infer<
  typeof helixSharedLiveRoomCreateRequestSchema
>;
export type HelixSharedLiveRoomPresenceSetRequest = z.infer<
  typeof helixSharedLiveRoomPresenceSetRequestSchema
>;
export type HelixSharedLiveRoomConsentRevokeRequest = z.infer<
  typeof helixSharedLiveRoomConsentRevokeRequestSchema
>;
export type HelixSharedLiveRoomConsentGrantRequest = z.infer<
  typeof helixSharedLiveRoomConsentGrantRequestSchema
>;
export type HelixSharedLiveRoomFloorReleaseRequest = z.infer<
  typeof helixSharedLiveRoomFloorReleaseRequestSchema
>;
export type HelixSharedLiveRoomFloorAcquireRequest = z.infer<
  typeof helixSharedLiveRoomFloorAcquireRequestSchema
>;
export type HelixSharedLiveRoomSourceCreateRequest = z.infer<
  typeof helixSharedLiveRoomSourceCreateRequestSchema
>;
export type HelixSharedLiveRoomRunBindingRequest = z.infer<
  typeof helixSharedLiveRoomRunBindingRequestSchema
>;
export type HelixSharedLiveRoomChatBindingClaimRequest = z.infer<
  typeof helixSharedLiveRoomChatBindingClaimRequestSchema
>;
export type HelixSharedLiveRoomRunBindingRevokeRequest = z.infer<
  typeof helixSharedLiveRoomRunBindingRevokeRequestSchema
>;
export type HelixSharedLiveRoomChatBindingRevokeRequest = z.infer<
  typeof helixSharedLiveRoomChatBindingRevokeRequestSchema
>;
export type HelixSharedLiveRoomCredentialDelivery = z.infer<
  typeof helixSharedLiveRoomCredentialDeliverySchema
>;

/**
 * Agent-facing source projection. The authenticated service owns profile and
 * credential identity, so neither is echoed into model-visible receipts.
 */
export type HelixSharedLiveRoomSourceBindingProjection = {
  schema: HelixRoomSourceBinding["schema"];
  binding_id: string;
  room_id: string;
  source_id: string;
  world_id: string;
  domain_adapter: string;
  source_label: string;
  scopes: HelixRoomSourceIngressScope[];
  status: HelixRoomSourceBinding["status"] | "pending_credential_claim";
  public_ingress_base_url: string;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  last_used_at: string | null;
  request_count: number;
  execution_policy: {
    may_execute_live_actions: false;
    may_perform_read_only_probes: true;
  };
  content_role: "source_binding_not_assistant_answer";
  reentry_required: true;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

type NonAuthoritativeReceipt = {
  api_version: typeof HELIX_SHARED_LIVE_ROOM_AGENT_API_VERSION;
  ok: true;
  content_role:
    | "room_control_observation_not_assistant_answer"
    | "room_control_receipt_not_assistant_answer"
    | "source_binding_observation_not_assistant_answer"
    | "source_binding_receipt_not_assistant_answer";
  reentry_required: true;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixSharedLiveRoomListReceipt = NonAuthoritativeReceipt & {
  schema: typeof HELIX_SHARED_LIVE_ROOM_LIST_RECEIPT_SCHEMA;
  operation: typeof HELIX_SHARED_LIVE_ROOM_LIST_CAPABILITY;
  rooms: HelixSharedRealtimeRoom[];
};

export type HelixSharedLiveRoomInspectReceipt = NonAuthoritativeReceipt & {
  schema: typeof HELIX_SHARED_LIVE_ROOM_INSPECT_RECEIPT_SCHEMA;
  operation: typeof HELIX_SHARED_LIVE_ROOM_INSPECT_CAPABILITY;
  room: HelixSharedRealtimeRoom;
};

export type HelixSharedLiveRoomCreateReceipt = NonAuthoritativeReceipt & {
  schema: typeof HELIX_SHARED_LIVE_ROOM_CREATE_RECEIPT_SCHEMA;
  operation: typeof HELIX_SHARED_LIVE_ROOM_CREATE_CAPABILITY;
  room: HelixSharedRealtimeRoom;
};

export type HelixSharedLiveRoomPresenceSetReceipt = NonAuthoritativeReceipt & {
  schema: typeof HELIX_SHARED_LIVE_ROOM_PRESENCE_SET_RECEIPT_SCHEMA;
  operation: typeof HELIX_SHARED_LIVE_ROOM_PRESENCE_SET_CAPABILITY;
  content_role: "room_control_receipt_not_assistant_answer";
  room: HelixSharedRealtimeRoom;
};

export type HelixSharedLiveRoomConsentRevokeReceipt = NonAuthoritativeReceipt & {
  schema: typeof HELIX_SHARED_LIVE_ROOM_CONSENT_REVOKE_RECEIPT_SCHEMA;
  operation: typeof HELIX_SHARED_LIVE_ROOM_CONSENT_REVOKE_CAPABILITY;
  content_role: "room_control_receipt_not_assistant_answer";
  room: HelixSharedRealtimeRoom;
  changed_fields: Array<keyof HelixSharedRealtimeRoomConsentPatch>;
  authority_delta: "reduced_only";
};

export type HelixSharedLiveRoomConsentGrantReceipt = NonAuthoritativeReceipt & {
  schema: typeof HELIX_SHARED_LIVE_ROOM_CONSENT_GRANT_RECEIPT_SCHEMA;
  operation: typeof HELIX_SHARED_LIVE_ROOM_CONSENT_GRANT_CAPABILITY;
  content_role: "room_control_receipt_not_assistant_answer";
  room: HelixSharedRealtimeRoom;
  changed_fields: Array<keyof HelixSharedRealtimeRoomConsentPatch>;
  delegation_ref: string;
  authority_delta: "increased_bounded";
};

export type HelixSharedLiveRoomFloorProjection = {
  participant_id: string | null;
  epoch: number;
  acquired_at: string | null;
  lease_expires_at: string | null;
};

export type HelixSharedLiveRoomFloorInspectReceipt = NonAuthoritativeReceipt & {
  schema: typeof HELIX_SHARED_LIVE_ROOM_FLOOR_INSPECT_RECEIPT_SCHEMA;
  operation: typeof HELIX_SHARED_LIVE_ROOM_FLOOR_INSPECT_CAPABILITY;
  content_role: "room_control_observation_not_assistant_answer";
  room_id: string;
  floor: HelixSharedLiveRoomFloorProjection | null;
};

export type HelixSharedLiveRoomFloorReleaseReceipt = NonAuthoritativeReceipt & {
  schema: typeof HELIX_SHARED_LIVE_ROOM_FLOOR_RELEASE_RECEIPT_SCHEMA;
  operation: typeof HELIX_SHARED_LIVE_ROOM_FLOOR_RELEASE_CAPABILITY;
  content_role: "room_control_receipt_not_assistant_answer";
  room: HelixSharedRealtimeRoom;
  released: boolean;
  requested_floor_epoch: number;
  floor: HelixSharedLiveRoomFloorProjection;
  authority_delta: "reduced_only";
};

export type HelixSharedLiveRoomFloorAcquireReceipt = NonAuthoritativeReceipt & {
  schema: typeof HELIX_SHARED_LIVE_ROOM_FLOOR_ACQUIRE_RECEIPT_SCHEMA;
  operation: typeof HELIX_SHARED_LIVE_ROOM_FLOOR_ACQUIRE_CAPABILITY;
  content_role: "room_control_receipt_not_assistant_answer";
  room: HelixSharedRealtimeRoom;
  granted: true;
  floor: HelixSharedLiveRoomFloorProjection;
  delegation_ref: string;
  authority_delta: "increased_bounded";
};

export type HelixSharedLiveRoomSourceListReceipt = NonAuthoritativeReceipt & {
  schema: typeof HELIX_SHARED_LIVE_ROOM_SOURCE_LIST_RECEIPT_SCHEMA;
  operation: typeof HELIX_SHARED_LIVE_ROOM_SOURCE_LIST_CAPABILITY;
  room_id: string;
  bindings: HelixSharedLiveRoomSourceBindingProjection[];
};

export type HelixSharedLiveRoomSourceCreateReceipt = NonAuthoritativeReceipt & {
  schema: typeof HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_RECEIPT_SCHEMA;
  operation: typeof HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_CAPABILITY;
  room_id: string;
  binding: HelixSharedLiveRoomSourceBindingProjection;
  credential_delivery: HelixSharedLiveRoomCredentialDelivery;
  execution_enabled: false;
  command_execution_enabled: false;
};

export type HelixSharedLiveRoomRunBindReceipt = NonAuthoritativeReceipt & {
  schema: typeof HELIX_SHARED_LIVE_ROOM_RUN_BIND_RECEIPT_SCHEMA;
  operation: typeof HELIX_SHARED_LIVE_ROOM_RUN_BIND_CAPABILITY;
  content_role: "room_control_receipt_not_assistant_answer";
  binding_ref: string;
  run_id: string;
  room_id: string;
  binding_status: "active";
  version: number;
};

export type HelixSharedLiveRoomChatBindingClaimReceipt =
  NonAuthoritativeReceipt & {
    schema: typeof HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_CLAIM_RECEIPT_SCHEMA;
    operation: typeof HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_CLAIM_CAPABILITY;
    content_role: "room_control_receipt_not_assistant_answer";
    binding_ref: string;
    run_id: string;
    binding_status: "active";
    context_snapshot_ref: string | null;
    context_message_count: number;
    context_char_count: number;
  };

type SharedLiveRoomBindingRevokeReceipt = NonAuthoritativeReceipt & {
  content_role: "room_control_receipt_not_assistant_answer";
  binding_ref: string;
  binding_status: "revoked";
  revocation_status: "revoked" | "already_revoked";
};

export type HelixSharedLiveRoomRunUnbindReceipt =
  SharedLiveRoomBindingRevokeReceipt & {
    schema: typeof HELIX_SHARED_LIVE_ROOM_RUN_UNBIND_RECEIPT_SCHEMA;
    operation: typeof HELIX_SHARED_LIVE_ROOM_RUN_UNBIND_CAPABILITY;
  };

export type HelixSharedLiveRoomChatBindingUnbindReceipt =
  SharedLiveRoomBindingRevokeReceipt & {
    schema: typeof HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_UNBIND_RECEIPT_SCHEMA;
    operation: typeof HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_UNBIND_CAPABILITY;
  };

export type HelixSharedLiveRoomAgentReceipt =
  | HelixSharedLiveRoomListReceipt
  | HelixSharedLiveRoomInspectReceipt
  | HelixSharedLiveRoomCreateReceipt
  | HelixSharedLiveRoomPresenceSetReceipt
  | HelixSharedLiveRoomConsentRevokeReceipt
  | HelixSharedLiveRoomFloorInspectReceipt
  | HelixSharedLiveRoomFloorReleaseReceipt
  | HelixSharedLiveRoomSourceListReceipt
  | HelixSharedLiveRoomSourceCreateReceipt
  | HelixSharedLiveRoomRunBindReceipt
  | HelixSharedLiveRoomChatBindingClaimReceipt
  | HelixSharedLiveRoomRunUnbindReceipt
  | HelixSharedLiveRoomChatBindingUnbindReceipt;

export const helixSharedLiveRoomControlErrorCodeSchema = z.enum([
  "invalid_request",
  "unauthorized",
  "insufficient_scope",
  "tenant_required",
  "tenant_mismatch",
  "account_not_linked",
  "auth_not_configured",
  "origin_not_allowed",
  "host_not_allowed",
  "https_required",
  "confirmation_required",
  "confirmation_invalid",
  "room_mcp_delegation_identity_unavailable",
  "room_mcp_delegation_identity_mismatch",
  "room_mcp_delegation_verifier_unavailable",
  "room_mcp_delegation_rejected",
  "account_policy_blocked",
  "run_not_found",
  "room_not_found",
  "room_forbidden",
  "room_closed",
  "room_runtime_conflict",
  "run_room_binding_conflict",
  "run_room_binding_not_found",
  "chat_binding_not_found",
  "chat_binding_expired",
  "chat_binding_not_claimable",
  "chat_binding_owner_mismatch",
  "chat_binding_conflict",
  "chat_session_owner_mismatch",
  "source_binding_invalid",
  "source_binding_not_found",
  "source_binding_forbidden",
  "source_binding_closed",
  "source_binding_revoked",
  "environment_adapter_unknown",
  "environment_adapter_disabled",
  "environment_adapter_identity_mismatch",
  "environment_adapter_protocol_unsupported",
  "environment_adapter_manifest_incompatible",
  "environment_adapter_admission_required",
  "environment_adapter_contract_changed",
  "environment_adapter_observation_schema_invalid",
  "environment_adapter_mechanics_incompatible",
  "credential_delivery_unavailable",
  "credential_delivery_invalid",
  "idempotency_conflict",
  "idempotency_in_progress",
  "outcome_unknown",
  "protected_sensitive_content_rejected",
  "command_execution_not_enabled",
  "internal_error",
]);

export type HelixSharedLiveRoomControlErrorCode = z.infer<
  typeof helixSharedLiveRoomControlErrorCodeSchema
>;

export const helixSharedLiveRoomErrorSchema = z
  .object({
    schema: z.literal(HELIX_SHARED_LIVE_ROOM_ERROR_SCHEMA),
    api_version: z.literal(HELIX_SHARED_LIVE_ROOM_AGENT_API_VERSION),
    error: helixSharedLiveRoomControlErrorCodeSchema,
    message: z.string(),
    request_id: z.string().nullable(),
    retryable: z.boolean(),
    details: z.record(z.unknown()).optional(),
    content_role: z.literal("room_control_error_not_assistant_answer"),
    reentry_required: z.literal(true),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

export type HelixSharedLiveRoomError = z.infer<
  typeof helixSharedLiveRoomErrorSchema
>;
