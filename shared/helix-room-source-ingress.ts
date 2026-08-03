import type { HelixEnvironmentCommandConnectorConfig } from "./helix-environment-command";

export const HELIX_ROOM_SOURCE_BINDING_SCHEMA =
  "helix.room_source_binding.v1" as const;
export const HELIX_ROOM_SOURCE_BINDING_RECEIPT_SCHEMA =
  "helix.room_source_binding_receipt.v1" as const;
export const HELIX_ROOM_SOURCE_INGRESS_RECEIPT_SCHEMA =
  "helix.room_source_ingress_receipt.v1" as const;
export const HELIX_ROOM_SOURCE_ADMISSION_SCHEMA =
  "helix.room_source_admission.v1" as const;
export const HELIX_ROOM_SOURCE_ID_PREFIX =
  "source:room-ingress:" as const;
export const HELIX_ROOM_SOURCE_NAMESPACE_RESERVED_ERROR =
  "environment_room_source_namespace_reserved" as const;

export const HELIX_ROOM_SOURCE_INGRESS_SCOPES = [
  "world_events:write",
  "manifest:write",
  "heartbeat:write",
  "probe_requests:read",
  "probe_results:write",
] as const;

export type HelixRoomSourceIngressScope =
  (typeof HELIX_ROOM_SOURCE_INGRESS_SCOPES)[number];

export type HelixRoomSourceBindingStatus =
  "active" | "revoked" | "expired" | "room_closed";

export type HelixRoomSourceBinding = {
  schema: typeof HELIX_ROOM_SOURCE_BINDING_SCHEMA;
  binding_id: string;
  room_id: string;
  owner_profile_id: string;
  source_id: string;
  world_id: string;
  domain_adapter: string;
  source_label: string;
  scopes: HelixRoomSourceIngressScope[];
  status: HelixRoomSourceBindingStatus;
  public_ingress_base_url: string;
  credential_id: string | null;
  token_prefix: string | null;
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

export type HelixRoomSourcePluginConfig = {
  endpoint: string;
  pairing_endpoint?: string;
  bearer_token: string;
  source_id: string;
  room_id: string;
  world_id: string;
  domain_adapter: string;
  execution_enabled: false;
  /**
   * Present only for an explicitly command-enabled in-game pairing. The
   * command credential remains distinct from the source ingress credential.
   */
  command?: HelixEnvironmentCommandConnectorConfig;
};

export type HelixRoomSourceBindingReceipt = {
  schema: typeof HELIX_ROOM_SOURCE_BINDING_RECEIPT_SCHEMA;
  ok: boolean;
  error: string | null;
  message: string;
  binding: HelixRoomSourceBinding | null;
  bindings?: HelixRoomSourceBinding[];
  token_value?: string | null;
  token_value_shown_once: boolean;
  plugin_config?: HelixRoomSourcePluginConfig | null;
  secret_stored_raw: false;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixRoomSourceIngressKind =
  | "world_event_batch"
  | "manifest"
  | "heartbeat"
  | "probe_requests"
  | "probe_result"
  | "status";

export type HelixRoomSourceAdmission = {
  schema: typeof HELIX_ROOM_SOURCE_ADMISSION_SCHEMA;
  transport: "room_source_ingress";
  binding_id: string;
  /** Binding-scoped server digest; never the producer's raw idempotency key. */
  request_id: string;
  room_id: string;
  source_id: string;
  world_id: string;
  domain_adapter: string;
  adapter_admission?: HelixEnvironmentAdapterAdmissionProjection | null;
  evidence_refs: string[];
  content_role: "source_admission_not_assistant_answer";
  reentry_required: true;
  model_invoked: false;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixRoomSourceProtectedIdentity = {
  source_id: string;
  room_id: string;
  world_id?: string | null;
  domain_adapter?: string | null;
};

export const isHelixRoomSourceIngressSourceId = (
  sourceId: unknown,
): sourceId is string =>
  typeof sourceId === "string" &&
  sourceId.startsWith(HELIX_ROOM_SOURCE_ID_PREFIX);

export const matchesHelixRoomSourceAdmission = (
  identity: HelixRoomSourceProtectedIdentity,
  admission: HelixRoomSourceAdmission | null | undefined,
): admission is HelixRoomSourceAdmission =>
  Boolean(
    admission &&
      admission.schema === HELIX_ROOM_SOURCE_ADMISSION_SCHEMA &&
      admission.transport === "room_source_ingress" &&
      admission.binding_id.trim() &&
      admission.request_id.trim() &&
      admission.room_id === identity.room_id &&
      admission.source_id === identity.source_id &&
      (identity.world_id === undefined ||
        admission.world_id === identity.world_id) &&
      (identity.domain_adapter === undefined ||
        admission.domain_adapter === identity.domain_adapter) &&
      admission.evidence_refs.includes(admission.binding_id) &&
      admission.evidence_refs.includes(
        `room_source_request:${admission.binding_id}:${admission.request_id}`,
      ) &&
      admission.content_role ===
        "source_admission_not_assistant_answer" &&
      admission.reentry_required === true &&
      admission.model_invoked === false &&
      admission.answer_authority === false &&
      admission.assistant_answer === false &&
      admission.terminal_eligible === false &&
      admission.raw_content_included === false,
  );

export const assertHelixRoomSourceNamespaceAdmission = (
  identity: HelixRoomSourceProtectedIdentity,
  admission?: HelixRoomSourceAdmission | null,
): void => {
  if (!isHelixRoomSourceIngressSourceId(identity.source_id)) return;
  if (matchesHelixRoomSourceAdmission(identity, admission)) return;
  throw new Error(HELIX_ROOM_SOURCE_NAMESPACE_RESERVED_ERROR);
};

export type HelixRoomSourceIngressReceipt = {
  schema: typeof HELIX_ROOM_SOURCE_INGRESS_RECEIPT_SCHEMA;
  ok: boolean;
  error: string | null;
  message: string;
  binding_id: string | null;
  room_id: string | null;
  source_id: string | null;
  world_id: string | null;
  /** Binding-scoped server digest; never the producer's raw idempotency key. */
  request_id: string | null;
  kind: HelixRoomSourceIngressKind;
  accepted: boolean;
  replayed: boolean;
  observation_ref?: Record<string, unknown> | null;
  probe_requests?: unknown[];
  content_role: "source_observation_not_assistant_answer";
  reentry_required: true;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};
import type { HelixEnvironmentAdapterAdmissionProjection } from "./helix-environment-adapter-profile";
