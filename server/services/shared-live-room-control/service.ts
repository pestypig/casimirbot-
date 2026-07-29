import crypto from "node:crypto";
import { ZodError } from "zod";
import type {
  HelixAccountCapabilityPolicy,
  HelixAccountType,
} from "@shared/helix-account-session";
import type { HelixSharedRealtimeRoom } from "@shared/helix-shared-realtime-room";
import type { HelixRoomSourceBinding } from "@shared/helix-room-source-ingress";
import {
  HELIX_SHARED_LIVE_ROOM_AGENT_API_VERSION,
  HELIX_SHARED_LIVE_ROOM_CREATE_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_CREATE_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_INSPECT_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_INSPECT_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_LIST_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_LIST_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
  HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
  HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_SOURCE_LIST_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_SOURCE_LIST_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE,
  helixSharedLiveRoomCreateRequestSchema,
  helixSharedLiveRoomCredentialDeliverySchema,
  helixSharedLiveRoomIdSchema,
  helixSharedLiveRoomSourceCreateRequestSchema,
  type HelixSharedLiveRoomAgentReceipt,
  type HelixSharedLiveRoomControlErrorCode,
  type HelixSharedLiveRoomCreateReceipt,
  type HelixSharedLiveRoomCredentialDelivery,
  type HelixSharedLiveRoomInspectReceipt,
  type HelixSharedLiveRoomListReceipt,
  type HelixSharedLiveRoomSourceBindingProjection,
  type HelixSharedLiveRoomSourceCreateReceipt,
  type HelixSharedLiveRoomSourceListReceipt,
} from "@shared/contracts/helix-shared-live-room-agent.v1";
import {
  isGuestSharedRealtimeRoomHostingEnabled,
  isGuestSharedRealtimeRoomSourceIngressEnabled,
} from "../helix-account/account-session-store";
import type { HelixAgentApiPrincipal } from "../helix-agent-api/types";
import {
  HelixAgentRunStore,
  type HelixAgentIdempotencyAcquireResult,
  type HelixAgentRunOwner,
} from "../helix-agent-api/run-store";
import type { HelixWorkstationGatewayAccountContext } from "../helix-ask/workstation-tool-gateway/account-policy";
import {
  createSharedRealtimeRoom,
  isSharedRealtimeRoomDomainError,
  listSharedRealtimeRooms,
  readSharedRealtimeRoom,
  readSharedRealtimeRoomMembership,
  type SharedRealtimeRoomMembership,
} from "../helix-ask/realtime-room/room-store";
import {
  isRoomSourceIngressError,
  listSharedRealtimeRoomSourceBindings,
} from "../helix-ask/realtime-room/source-link-store";
import { runWithSharedRealtimeProfileAdmissionLock } from "../helix-ask/realtime-room/profile-admission-lock";
import { readSharedRealtimeRoomRuntime } from "../helix-ask/realtime-room/runtime-registry";
import { projectSharedRealtimeRoomParticipantContext } from "../helix-ask/realtime-room/participant-context";
import { SharedLiveRoomBindingStoreError } from "./binding-store";
import {
  containsSharedLiveRoomSensitiveValue,
  redactSharedLiveRoomSensitiveValue,
} from "./sensitive-text";

type RecordLike = Record<string, unknown>;

export const DEFAULT_SHARED_LIVE_ROOM_SOURCE_CREDENTIAL_TTL_MS =
  7 * 24 * 60 * 60 * 1_000;

export type SharedLiveRoomControlAuthKind =
  "first_party_session" | "external_oauth";

export type SharedLiveRoomControlActor = {
  authKind: SharedLiveRoomControlAuthKind;
  profileId: string;
  accountType: HelixAccountType;
  accountPolicy: HelixAccountCapabilityPolicy;
  sessionId: string | null;
  isGuest: boolean;
  oauthScopes: ReadonlySet<string>;
  idempotencyOwner: HelixAgentRunOwner;
};

export const sharedLiveRoomActorAllowsSourceIngress = (
  actor: SharedLiveRoomControlActor,
): boolean => {
  const roomFeatureAllowed =
    actor.accountPolicy.feature_flags.includes("shared_realtime_rooms") &&
    !actor.accountPolicy.locked_features.includes("shared_realtime_rooms");
  const sourceFeatureAllowed =
    actor.accountPolicy.feature_flags.includes("room_source_ingress") &&
    !actor.accountPolicy.locked_features.includes("room_source_ingress");
  if (!roomFeatureAllowed || !sourceFeatureAllowed) return false;
  if (actor.accountType === "developer") return true;
  return (
    actor.authKind === "first_party_session" &&
    actor.isGuest &&
    isGuestSharedRealtimeRoomSourceIngressEnabled()
  );
};

export const MAX_GUEST_ROOM_SOURCE_CREDENTIAL_TTL_MS =
  24 * 60 * 60 * 1_000;

export const resolveSharedLiveRoomSourceCredentialTtlMs = (
  actor: SharedLiveRoomControlActor,
  requestedTtlMs?: number | null,
): number => {
  const requested =
    requestedTtlMs ?? DEFAULT_SHARED_LIVE_ROOM_SOURCE_CREDENTIAL_TTL_MS;
  return actor.isGuest
    ? Math.min(requested, MAX_GUEST_ROOM_SOURCE_CREDENTIAL_TTL_MS)
    : requested;
};

export type SharedLiveRoomCredentialDeliveryOwner = {
  auth_kind: SharedLiveRoomControlAuthKind;
  profile_id: string;
  tenant_id: string;
  issuer: string;
  subject_id: string;
  session_id: string | null;
};

/**
 * A trusted implementation creates a short-lived, owner-bound claim without
 * generating or receiving the source bearer. The claim consumer is the only
 * path permitted to mint and reveal that credential.
 */
export interface SharedLiveRoomSecureCredentialDelivery {
  issue(input: {
    owner: SharedLiveRoomCredentialDeliveryOwner;
    binding: HelixRoomSourceBinding;
    issuedAt: string;
    credentialTtlMs: number;
  }): Promise<HelixSharedLiveRoomCredentialDelivery>;
}

/**
 * The source store must insert identity and policy state without generating a
 * bearer. The trusted claim path generates and hashes the credential only when
 * the owner consumes the delivery handle.
 */
export interface SharedLiveRoomDeferredSourceBindingStore {
  createSourceBindingWithoutCredential(input: {
    roomId: string;
    ownerProfileId: string;
    worldId?: string | null;
    domainAdapter?: string | null;
    sourceLabel?: string | null;
    ttlMs?: number | null;
  }): Promise<HelixRoomSourceBinding>;
}

type SharedLiveRoomIdempotencyStore = Pick<
  HelixAgentRunStore,
  | "acquireIdempotency"
  | "completeIdempotency"
  | "markIdempotencyOutcomeUnknown"
  | "abandonIdempotency"
>;

type SharedLiveRoomDomainStore = {
  createRoom: typeof createSharedRealtimeRoom;
  listRooms: typeof listSharedRealtimeRooms;
  readRoom: typeof readSharedRealtimeRoom;
  readMembership: typeof readSharedRealtimeRoomMembership;
  listSourceBindings: typeof listSharedRealtimeRoomSourceBindings;
};

export type SharedLiveRoomControlDependencies = {
  idempotencyStore?: SharedLiveRoomIdempotencyStore;
  domainStore?: Partial<SharedLiveRoomDomainStore>;
  deferredSourceBindingStore?: SharedLiveRoomDeferredSourceBindingStore;
  credentialDelivery?: SharedLiveRoomSecureCredentialDelivery;
  now?: () => Date;
  guestHostingAllowed?: () => boolean;
  withProfileAdmissionLock?: <T>(
    profileId: string,
    run: () => Promise<T>,
  ) => Promise<T>;
  projectRoom?: (
    room: HelixSharedRealtimeRoom,
  ) => HelixSharedRealtimeRoom | Promise<HelixSharedRealtimeRoom>;
};

export class SharedLiveRoomControlError extends Error {
  constructor(
    readonly status: number,
    readonly code: HelixSharedLiveRoomControlErrorCode,
    message: string,
    readonly retryable = false,
    readonly details?: RecordLike,
  ) {
    super(message);
    this.name = "SharedLiveRoomControlError";
  }
}

export type SharedLiveRoomControlMutationResult<
  T extends HelixSharedLiveRoomAgentReceipt,
> = {
  status: 201;
  body: T;
  idempotencyReplayed: boolean;
};

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const sha256 = (value: string): string =>
  crypto.createHash("sha256").update(value, "utf8").digest("hex");

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as RecordLike)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalize(item)]),
  );
};

const contentHash = (value: unknown): string =>
  `sha256:${sha256(JSON.stringify(canonicalize(value)))}`;

const firstPartySubject = (sessionId: string, profileId: string): string =>
  `first-party-session:${sha256(`${sessionId}\n${profileId}`).slice(0, 40)}`;

export const buildSharedLiveRoomControlActorFromAgentPrincipal = (
  principal: HelixAgentApiPrincipal,
): SharedLiveRoomControlActor => ({
  authKind: "external_oauth",
  profileId: principal.accountProfileId,
  accountType: principal.accountType,
  accountPolicy: principal.accountContext.account_policy,
  sessionId: principal.accountContext.session_id,
  isGuest: false,
  oauthScopes: principal.scopes,
  idempotencyOwner: {
    tenantId: principal.tenantId,
    issuer: principal.issuer,
    subjectId: principal.subjectId,
    accountProfileId: principal.accountProfileId,
  },
});

export const buildSharedLiveRoomControlActorFromAccountContext = (
  context: HelixWorkstationGatewayAccountContext,
): SharedLiveRoomControlActor => {
  const sessionId = normalize(context.session_id);
  const profileId = normalize(context.profile_id);
  if (
    !context.trusted_account_session ||
    !context.account_session ||
    !sessionId ||
    !profileId
  ) {
    throw new SharedLiveRoomControlError(
      401,
      "account_policy_blocked",
      "A trusted signed-in account session is required.",
    );
  }
  return {
    authKind: "first_party_session",
    profileId,
    accountType: context.account_policy.account_type,
    accountPolicy: context.account_policy,
    sessionId,
    isGuest: context.account_session.profile.auth_mode === "guest",
    oauthScopes: new Set<string>(),
    idempotencyOwner: {
      tenantId: "helix:first-party",
      issuer: "helix:first-party-account-session",
      subjectId: firstPartySubject(sessionId, profileId),
      accountProfileId: profileId,
    },
  };
};

const defaultProjectRoom = (
  room: HelixSharedRealtimeRoom,
): HelixSharedRealtimeRoom => {
  const runtime = readSharedRealtimeRoomRuntime({ roomId: room.room_id });
  const active =
    runtime?.state === "host_transport_active" ||
    runtime?.state === "bridge_active";
  return projectSharedRealtimeRoomParticipantContext(
    runtime
      ? {
          ...room,
          status:
            room.status === "closed"
              ? "closed"
              : active
                ? "active"
                : room.status,
          runtime,
        }
      : room,
  );
};

const publicSourceBinding = (
  binding: HelixRoomSourceBinding,
): HelixSharedLiveRoomSourceBindingProjection =>
  redactSharedLiveRoomSensitiveValue({
    schema: binding.schema,
    binding_id: binding.binding_id,
    room_id: binding.room_id,
    source_id: binding.source_id,
    world_id: binding.world_id,
    domain_adapter: binding.domain_adapter,
    source_label: binding.source_label,
    scopes: [...binding.scopes],
    status: binding.status,
    public_ingress_base_url: binding.public_ingress_base_url,
    created_at: binding.created_at,
    updated_at: binding.updated_at,
    expires_at: binding.expires_at,
    revoked_at: binding.revoked_at,
    last_used_at: binding.last_used_at,
    request_count: binding.request_count,
    execution_policy: {
      may_execute_live_actions: false,
      may_perform_read_only_probes: true,
    },
    content_role: "source_binding_not_assistant_answer",
    reentry_required: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });

const assertNoProtectedControlInput = (value: unknown): void => {
  if (!containsSharedLiveRoomSensitiveValue(value)) return;
  throw new SharedLiveRoomControlError(
    400,
    "protected_sensitive_content_rejected",
    "Protected credential material is not accepted in Shared Live Room control input.",
  );
};

const receiptBase = {
  api_version: HELIX_SHARED_LIVE_ROOM_AGENT_API_VERSION,
  ok: true,
  reentry_required: true,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
} as const;

type DurableSourceCreateIdempotencyReceipt = RecordLike & {
  operation: typeof HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_CAPABILITY;
  durable_resource: {
    room_id: string;
    binding_id: string;
    credential_delivery_handle_persisted: false;
  };
};

const isReceiptForOperation = (value: RecordLike, operation: string): boolean =>
  value.operation === operation &&
  value.ok === true &&
  value.answer_authority === false &&
  value.assistant_answer === false &&
  value.terminal_eligible === false &&
  value.raw_content_included === false;

const roomErrorCode = (code: string): HelixSharedLiveRoomControlErrorCode => {
  if (code === "shared_realtime_room_not_found") return "room_not_found";
  if (code === "shared_realtime_room_closed") return "room_closed";
  if (code === "shared_realtime_room_runtime_conflict") {
    return "room_runtime_conflict";
  }
  if (
    code === "shared_realtime_room_forbidden" ||
    code === "shared_realtime_room_auth_required"
  ) {
    return "room_forbidden";
  }
  if (
    code === "shared_realtime_room_invalid_request" ||
    code === "shared_realtime_room_invite_invalid"
  ) {
    return "invalid_request";
  }
  return "internal_error";
};

const sourceErrorCode = (code: string): HelixSharedLiveRoomControlErrorCode => {
  if (code === "room_source_binding_not_found") {
    return "source_binding_not_found";
  }
  if (code === "room_source_binding_forbidden") {
    return "source_binding_forbidden";
  }
  if (code === "room_source_binding_closed") return "source_binding_closed";
  if (code === "room_source_binding_revoked") return "source_binding_revoked";
  if (code === "room_source_binding_invalid") return "source_binding_invalid";
  if (
    code === "environment_adapter_unknown" ||
    code === "environment_adapter_disabled" ||
    code === "environment_adapter_identity_mismatch" ||
    code === "environment_adapter_protocol_unsupported" ||
    code === "environment_adapter_manifest_incompatible" ||
    code === "environment_adapter_admission_required" ||
    code === "environment_adapter_contract_changed" ||
    code === "environment_adapter_observation_schema_invalid" ||
    code === "environment_adapter_mechanics_incompatible"
  ) {
    return code;
  }
  return "internal_error";
};

const normalizeControlError = (error: unknown): SharedLiveRoomControlError => {
  if (error instanceof SharedLiveRoomControlError) return error;
  if (error instanceof ZodError) {
    return new SharedLiveRoomControlError(
      400,
      "invalid_request",
      "The Shared Live Room request is invalid.",
      false,
      { issues: error.issues },
    );
  }
  if (isSharedRealtimeRoomDomainError(error)) {
    return new SharedLiveRoomControlError(
      error.statusCode,
      roomErrorCode(error.code),
      error.message,
    );
  }
  if (isRoomSourceIngressError(error)) {
    return new SharedLiveRoomControlError(
      error.statusCode,
      sourceErrorCode(error.code),
      error.message,
    );
  }
  if (error instanceof SharedLiveRoomBindingStoreError) {
    if (error.code === "credential_delivery_not_claimable") {
      return new SharedLiveRoomControlError(
        409,
        "credential_delivery_unavailable",
        error.message,
        false,
        {
          delivery_status: "claimed_or_not_claimable",
          recovery_action: "rotate_source_credential",
        },
      );
    }
    if (error.code === "source_binding_not_found") {
      return new SharedLiveRoomControlError(
        error.statusCode,
        "source_binding_not_found",
        error.message,
      );
    }
    if (error.code === "source_binding_owner_mismatch") {
      return new SharedLiveRoomControlError(
        404,
        "source_binding_not_found",
        "Room source binding not found.",
      );
    }
    if (error.code === "source_binding_closed") {
      return new SharedLiveRoomControlError(
        error.statusCode,
        "source_binding_closed",
        error.message,
      );
    }
  }
  return new SharedLiveRoomControlError(
    500,
    "internal_error",
    "Shared Live Room control could not complete the request.",
    true,
  );
};

export class SharedLiveRoomControlService {
  private readonly idempotencyStore: SharedLiveRoomIdempotencyStore;
  private readonly domainStore: SharedLiveRoomDomainStore;
  private readonly credentialDelivery?: SharedLiveRoomSecureCredentialDelivery;
  private readonly deferredSourceBindingStore?: SharedLiveRoomDeferredSourceBindingStore;
  private readonly now: () => Date;
  private readonly guestHostingAllowed: () => boolean;
  private readonly withProfileAdmissionLock: <T>(
    profileId: string,
    run: () => Promise<T>,
  ) => Promise<T>;
  private readonly projectRoom: (
    room: HelixSharedRealtimeRoom,
  ) => HelixSharedRealtimeRoom | Promise<HelixSharedRealtimeRoom>;

  constructor(dependencies: SharedLiveRoomControlDependencies = {}) {
    this.idempotencyStore =
      dependencies.idempotencyStore ?? new HelixAgentRunStore();
    this.domainStore = {
      createRoom:
        dependencies.domainStore?.createRoom ?? createSharedRealtimeRoom,
      listRooms: dependencies.domainStore?.listRooms ?? listSharedRealtimeRooms,
      readRoom: dependencies.domainStore?.readRoom ?? readSharedRealtimeRoom,
      readMembership:
        dependencies.domainStore?.readMembership ??
        readSharedRealtimeRoomMembership,
      listSourceBindings:
        dependencies.domainStore?.listSourceBindings ??
        listSharedRealtimeRoomSourceBindings,
    };
    this.deferredSourceBindingStore = dependencies.deferredSourceBindingStore;
    this.credentialDelivery = dependencies.credentialDelivery;
    this.now = dependencies.now ?? (() => new Date());
    this.guestHostingAllowed =
      dependencies.guestHostingAllowed ??
      isGuestSharedRealtimeRoomHostingEnabled;
    this.withProfileAdmissionLock =
      dependencies.withProfileAdmissionLock ??
      runWithSharedRealtimeProfileAdmissionLock;
    this.projectRoom = dependencies.projectRoom ?? defaultProjectRoom;
  }

  private requireFeature(actor: SharedLiveRoomControlActor): void {
    const policy = actor.accountPolicy;
    if (
      !policy.feature_flags.includes("shared_realtime_rooms") ||
      policy.locked_features.includes("shared_realtime_rooms")
    ) {
      throw new SharedLiveRoomControlError(
        403,
        "account_policy_blocked",
        "Shared Live Rooms are locked by the active account policy.",
      );
    }
  }

  private requireOauthScope(
    actor: SharedLiveRoomControlActor,
    scope: string,
  ): void {
    if (actor.authKind !== "external_oauth" || actor.oauthScopes.has(scope)) {
      return;
    }
    throw new SharedLiveRoomControlError(
      403,
      "insufficient_scope",
      `The bearer token is missing the required ${scope} scope.`,
      false,
      {
        required_scope: scope,
        required_oauth_scopes: [scope],
      },
    );
  }

  private requireRead(actor: SharedLiveRoomControlActor): void {
    this.requireFeature(actor);
    this.requireOauthScope(actor, HELIX_SHARED_LIVE_ROOM_READ_SCOPE);
  }

  private requireManage(actor: SharedLiveRoomControlActor): void {
    this.requireFeature(actor);
    this.requireOauthScope(actor, HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE);
  }

  private requireSourceManage(actor: SharedLiveRoomControlActor): void {
    this.requireFeature(actor);
    this.requireOauthScope(actor, HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE);
    if (!sharedLiveRoomActorAllowsSourceIngress(actor)) {
      throw new SharedLiveRoomControlError(
        403,
        "source_binding_forbidden",
        "Room source ingress is not enabled for this room owner.",
      );
    }
  }

  private async requireOwnerMembership(
    actor: SharedLiveRoomControlActor,
    roomId: string,
  ): Promise<SharedRealtimeRoomMembership> {
    const membership = await this.domainStore.readMembership({
      roomId,
      profileId: actor.profileId,
    });
    if (!membership) {
      throw new SharedLiveRoomControlError(
        404,
        "room_not_found",
        "Shared Live Room not found.",
      );
    }
    if (membership.role !== "owner") {
      throw new SharedLiveRoomControlError(
        403,
        "source_binding_forbidden",
        "Only the room owner can manage environment source links.",
      );
    }
    if (membership.roomStatus === "closed") {
      throw new SharedLiveRoomControlError(
        410,
        "source_binding_closed",
        "The room is closed.",
      );
    }
    return membership;
  }

  private async projectSafeRoom(
    room: HelixSharedRealtimeRoom,
  ): Promise<HelixSharedRealtimeRoom> {
    return redactSharedLiveRoomSensitiveValue(await this.projectRoom(room));
  }

  private async acquireIdempotency(input: {
    actor: SharedLiveRoomControlActor;
    operation: string;
    receiptOperation?: string;
    idempotencyKey: string;
    request: unknown;
  }): Promise<{
    keyHash: string;
    requestHash: string;
    replay: RecordLike | null;
  }> {
    const key = normalize(input.idempotencyKey);
    if (key.length < 8 || key.length > 200) {
      throw new SharedLiveRoomControlError(
        400,
        "invalid_request",
        "A caller-stable idempotency key containing 8-200 characters is required.",
      );
    }
    const now = this.now();
    const keyHash = `sha256:${sha256(key)}`;
    const requestHash = contentHash(input.request);
    const acquired = await this.idempotencyStore.acquireIdempotency({
      owner: input.actor.idempotencyOwner,
      operation: input.operation,
      keyHash,
      requestHash,
      runId: null,
      now: now.toISOString(),
      leaseExpiresAt: new Date(now.getTime() + 2 * 60_000).toISOString(),
      expiresAt: new Date(now.getTime() + 24 * 60 * 60_000).toISOString(),
    });
    if (acquired.kind === "replay") {
      if (
        !isReceiptForOperation(
          acquired.receipt,
          input.receiptOperation ?? input.operation,
        )
      ) {
        throw new SharedLiveRoomControlError(
          500,
          "internal_error",
          "The durable idempotency receipt does not match this operation.",
        );
      }
      return {
        keyHash,
        requestHash,
        replay: acquired.receipt,
      };
    }
    if (acquired.kind !== "acquired") {
      this.throwIdempotencyAcquisitionError(acquired);
    }
    return { keyHash, requestHash, replay: null };
  }

  private throwIdempotencyAcquisitionError(
    acquired: Exclude<
      HelixAgentIdempotencyAcquireResult,
      { kind: "acquired" } | { kind: "replay" }
    >,
  ): never {
    if (acquired.kind === "conflict") {
      throw new SharedLiveRoomControlError(
        409,
        "idempotency_conflict",
        "The idempotency key was already used with different validated input.",
      );
    }
    if (acquired.kind === "in_progress") {
      throw new SharedLiveRoomControlError(
        409,
        "idempotency_in_progress",
        "An identical mutation is still processing.",
        true,
        {
          lease_expires_at: acquired.leaseExpiresAt,
          resource_ref: acquired.runId,
        },
      );
    }
    throw new SharedLiveRoomControlError(
      409,
      "outcome_unknown",
      "A prior mutation may have completed without a durable response receipt.",
      false,
      { resource_ref: acquired.runId },
    );
  }

  private async completeIdempotency(input: {
    actor: SharedLiveRoomControlActor;
    operation: string;
    keyHash: string;
    requestHash: string;
    receipt: RecordLike;
  }): Promise<void> {
    await this.idempotencyStore.completeIdempotency({
      owner: input.actor.idempotencyOwner,
      operation: input.operation,
      keyHash: input.keyHash,
      requestHash: input.requestHash,
      runId: null,
      status: 201,
      receipt: input.receipt as unknown as RecordLike,
      now: this.now().toISOString(),
    });
  }

  private sourceCreateReplaySeed(input: {
    receipt: RecordLike;
    roomId: string;
  }): DurableSourceCreateIdempotencyReceipt {
    const durableResource =
      input.receipt.durable_resource &&
      typeof input.receipt.durable_resource === "object" &&
      !Array.isArray(input.receipt.durable_resource)
        ? (input.receipt.durable_resource as RecordLike)
        : null;
    const bindingId = normalize(durableResource?.binding_id);
    if (
      !durableResource ||
      normalize(durableResource.room_id) !== input.roomId ||
      durableResource.credential_delivery_handle_persisted !== false ||
      !bindingId
    ) {
      throw new SharedLiveRoomControlError(
        500,
        "internal_error",
        "The durable source-creation receipt is missing its safe resource reference.",
      );
    }
    return input.receipt as DurableSourceCreateIdempotencyReceipt;
  }

  private async issueSourceCredentialDelivery(input: {
    actor: SharedLiveRoomControlActor;
    binding: HelixRoomSourceBinding;
    credentialTtlMs: number;
  }): Promise<HelixSharedLiveRoomCredentialDelivery> {
    if (!this.credentialDelivery) {
      throw new SharedLiveRoomControlError(
        503,
        "credential_delivery_unavailable",
        "Secure source credential delivery is not configured.",
        true,
      );
    }
    const rawDelivery = await this.credentialDelivery.issue({
      owner: {
        auth_kind: input.actor.authKind,
        profile_id: input.actor.profileId,
        tenant_id: input.actor.idempotencyOwner.tenantId,
        issuer: input.actor.idempotencyOwner.issuer,
        subject_id: input.actor.idempotencyOwner.subjectId,
        session_id: input.actor.sessionId,
      },
      binding: input.binding,
      issuedAt: this.now().toISOString(),
      credentialTtlMs: input.credentialTtlMs,
    });
    const deliveryResult =
      helixSharedLiveRoomCredentialDeliverySchema.safeParse(rawDelivery);
    if (!deliveryResult.success) {
      throw new SharedLiveRoomControlError(
        503,
        "credential_delivery_invalid",
        "Secure source credential delivery returned an invalid descriptor.",
        true,
        { issues: deliveryResult.error.issues },
      );
    }
    return deliveryResult.data;
  }

  private sourceCreateReceipt(input: {
    roomId: string;
    binding: HelixRoomSourceBinding;
    delivery: HelixSharedLiveRoomCredentialDelivery;
  }): HelixSharedLiveRoomSourceCreateReceipt {
    return {
      ...receiptBase,
      schema: HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_RECEIPT_SCHEMA,
      operation: HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_CAPABILITY,
      content_role: "source_binding_receipt_not_assistant_answer",
      room_id: input.roomId,
      binding: {
        ...publicSourceBinding(input.binding),
        status: "pending_credential_claim",
      },
      credential_delivery: input.delivery,
      execution_enabled: false,
      command_execution_enabled: false,
    };
  }

  private durableSourceCreateReceipt(input: {
    roomId: string;
    bindingId: string;
  }): DurableSourceCreateIdempotencyReceipt {
    return {
      ...receiptBase,
      schema: HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_RECEIPT_SCHEMA,
      operation: HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_CAPABILITY,
      content_role: "source_binding_receipt_not_assistant_answer",
      durable_resource: {
        room_id: input.roomId,
        binding_id: input.bindingId,
        credential_delivery_handle_persisted: false,
      },
    };
  }

  private async abandonIdempotency(input: {
    actor: SharedLiveRoomControlActor;
    operation: string;
    keyHash: string;
    requestHash: string;
  }): Promise<void> {
    await this.idempotencyStore.abandonIdempotency({
      owner: input.actor.idempotencyOwner,
      operation: input.operation,
      keyHash: input.keyHash,
      requestHash: input.requestHash,
    });
  }

  private async markIdempotencyOutcomeUnknown(input: {
    actor: SharedLiveRoomControlActor;
    operation: string;
    keyHash: string;
    requestHash: string;
    resourceRef?: string | null;
  }): Promise<void> {
    await this.idempotencyStore.markIdempotencyOutcomeUnknown({
      owner: input.actor.idempotencyOwner,
      operation: input.operation,
      keyHash: input.keyHash,
      requestHash: input.requestHash,
      runId: input.resourceRef ?? null,
      now: this.now().toISOString(),
    });
  }

  async listRooms(input: {
    actor: SharedLiveRoomControlActor;
  }): Promise<HelixSharedLiveRoomListReceipt> {
    try {
      this.requireRead(input.actor);
      const rooms = await this.domainStore.listRooms({
        profileId: input.actor.profileId,
      });
      return {
        ...receiptBase,
        schema: HELIX_SHARED_LIVE_ROOM_LIST_RECEIPT_SCHEMA,
        operation: HELIX_SHARED_LIVE_ROOM_LIST_CAPABILITY,
        content_role: "room_control_observation_not_assistant_answer",
        rooms: await Promise.all(
          rooms.map((room) => this.projectSafeRoom(room)),
        ),
      };
    } catch (error) {
      throw normalizeControlError(error);
    }
  }

  async inspectRoom(input: {
    actor: SharedLiveRoomControlActor;
    roomId: string;
  }): Promise<HelixSharedLiveRoomInspectReceipt> {
    try {
      this.requireRead(input.actor);
      const roomId = helixSharedLiveRoomIdSchema.parse(input.roomId);
      const room = await this.domainStore.readRoom({
        roomId,
        profileId: input.actor.profileId,
      });
      return {
        ...receiptBase,
        schema: HELIX_SHARED_LIVE_ROOM_INSPECT_RECEIPT_SCHEMA,
        operation: HELIX_SHARED_LIVE_ROOM_INSPECT_CAPABILITY,
        content_role: "room_control_observation_not_assistant_answer",
        room: await this.projectSafeRoom(room),
      };
    } catch (error) {
      throw normalizeControlError(error);
    }
  }

  async createRoom(input: {
    actor: SharedLiveRoomControlActor;
    idempotencyKey: string;
    request: unknown;
  }): Promise<
    SharedLiveRoomControlMutationResult<HelixSharedLiveRoomCreateReceipt>
  > {
    let reservation: { keyHash: string; requestHash: string } | null = null;
    let committedRoomId: string | null = null;
    try {
      this.requireManage(input.actor);
      if (input.actor.isGuest && !this.guestHostingAllowed()) {
        throw new SharedLiveRoomControlError(
          403,
          "room_forbidden",
          "Temporary guests may not create Shared Live Rooms on this server.",
        );
      }
      assertNoProtectedControlInput(input.request);
      const request = helixSharedLiveRoomCreateRequestSchema.parse(
        input.request,
      );
      const idempotency = await this.acquireIdempotency({
        actor: input.actor,
        operation: HELIX_SHARED_LIVE_ROOM_CREATE_CAPABILITY,
        idempotencyKey: input.idempotencyKey,
        request,
      });
      if (idempotency.replay) {
        return {
          status: 201,
          body: redactSharedLiveRoomSensitiveValue(
            idempotency.replay,
          ) as HelixSharedLiveRoomCreateReceipt,
          idempotencyReplayed: true,
        };
      }
      reservation = idempotency;

      const create = async (): Promise<HelixSharedRealtimeRoom> => {
        if (input.actor.isGuest) {
          const activeRooms = await this.domainStore.listRooms({
            profileId: input.actor.profileId,
          });
          if (activeRooms.some((room) => room.status !== "closed")) {
            throw new SharedLiveRoomControlError(
              409,
              "room_runtime_conflict",
              "A temporary guest can host only one active Shared Live Room.",
            );
          }
        }
        return this.domainStore.createRoom({
          ownerProfileId: input.actor.profileId,
          title: request.title,
        });
      };
      const created = input.actor.isGuest
        ? await this.withProfileAdmissionLock(input.actor.profileId, create)
        : await create();
      committedRoomId = created.room_id;
      const receipt: HelixSharedLiveRoomCreateReceipt = {
        ...receiptBase,
        schema: HELIX_SHARED_LIVE_ROOM_CREATE_RECEIPT_SCHEMA,
        operation: HELIX_SHARED_LIVE_ROOM_CREATE_CAPABILITY,
        content_role: "room_control_receipt_not_assistant_answer",
        room: await this.projectSafeRoom(created),
      };
      await this.completeIdempotency({
        actor: input.actor,
        operation: HELIX_SHARED_LIVE_ROOM_CREATE_CAPABILITY,
        ...reservation,
        receipt: receipt as unknown as RecordLike,
      });
      return { status: 201, body: receipt, idempotencyReplayed: false };
    } catch (error) {
      if (reservation) {
        if (committedRoomId) {
          await this.markIdempotencyOutcomeUnknown({
            actor: input.actor,
            operation: HELIX_SHARED_LIVE_ROOM_CREATE_CAPABILITY,
            ...reservation,
            resourceRef: committedRoomId,
          }).catch(() => undefined);
        } else {
          await this.abandonIdempotency({
            actor: input.actor,
            operation: HELIX_SHARED_LIVE_ROOM_CREATE_CAPABILITY,
            ...reservation,
          }).catch(() => undefined);
        }
      }
      throw normalizeControlError(error);
    }
  }

  async listSourceBindings(input: {
    actor: SharedLiveRoomControlActor;
    roomId: string;
  }): Promise<HelixSharedLiveRoomSourceListReceipt> {
    try {
      this.requireSourceManage(input.actor);
      const roomId = helixSharedLiveRoomIdSchema.parse(input.roomId);
      await this.requireOwnerMembership(input.actor, roomId);
      const bindings = await this.domainStore.listSourceBindings({
        roomId,
        ownerProfileId: input.actor.profileId,
      });
      return {
        ...receiptBase,
        schema: HELIX_SHARED_LIVE_ROOM_SOURCE_LIST_RECEIPT_SCHEMA,
        operation: HELIX_SHARED_LIVE_ROOM_SOURCE_LIST_CAPABILITY,
        content_role: "source_binding_observation_not_assistant_answer",
        room_id: roomId,
        bindings: bindings.map(publicSourceBinding),
      };
    } catch (error) {
      throw normalizeControlError(error);
    }
  }

  async createSourceBinding(input: {
    actor: SharedLiveRoomControlActor;
    roomId: string;
    idempotencyKey: string;
    request: unknown;
  }): Promise<
    SharedLiveRoomControlMutationResult<HelixSharedLiveRoomSourceCreateReceipt>
  > {
    let reservation: { keyHash: string; requestHash: string } | null = null;
    let committedBindingId: string | null = null;
    try {
      this.requireSourceManage(input.actor);
      if (!this.credentialDelivery || !this.deferredSourceBindingStore) {
        throw new SharedLiveRoomControlError(
          503,
          "credential_delivery_unavailable",
          "Secure source credential delivery is not configured.",
          true,
        );
      }
      const roomId = helixSharedLiveRoomIdSchema.parse(input.roomId);
      assertNoProtectedControlInput(input.request);
      const request = helixSharedLiveRoomSourceCreateRequestSchema.parse(
        input.request,
      );
      await this.requireOwnerMembership(input.actor, roomId);
      const idempotency = await this.acquireIdempotency({
        actor: input.actor,
        operation: `${HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_CAPABILITY}:${roomId}`,
        receiptOperation: HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_CAPABILITY,
        idempotencyKey: input.idempotencyKey,
        request: { room_id: roomId, ...request },
      });
      if (idempotency.replay) {
        const replaySeed = this.sourceCreateReplaySeed({
          receipt: idempotency.replay,
          roomId,
        });
        const bindingId = replaySeed.durable_resource.binding_id;
        const currentBindings = await this.domainStore.listSourceBindings({
          roomId,
          ownerProfileId: input.actor.profileId,
        });
        const binding = currentBindings.find(
          (candidate) =>
            candidate.binding_id === bindingId && candidate.room_id === roomId,
        );
        if (!binding) {
          throw new SharedLiveRoomControlError(
            404,
            "source_binding_not_found",
            "The idempotently created source binding is no longer available.",
            false,
            { binding_id: bindingId },
          );
        }
        if (normalize(binding.credential_id)) {
          const credentialExpired =
            Boolean(binding.expires_at) &&
            new Date(binding.expires_at as string).getTime() <=
              this.now().getTime();
          throw new SharedLiveRoomControlError(
            409,
            "credential_delivery_unavailable",
            credentialExpired
              ? "The source binding already has an expired credential; use the owner credential-rotation flow."
              : "The source credential delivery was already claimed; its one-time handle cannot be replayed.",
            false,
            {
              binding_id: binding.binding_id,
              delivery_status: credentialExpired
                ? "credential_expired"
                : "claimed",
              recovery_action: "rotate_source_credential",
            },
          );
        }
        const delivery = await this.issueSourceCredentialDelivery({
          actor: input.actor,
          binding,
          credentialTtlMs: resolveSharedLiveRoomSourceCredentialTtlMs(
            input.actor,
            request.ttl_ms,
          ),
        });
        return {
          status: 201,
          body: this.sourceCreateReceipt({
            roomId,
            binding,
            delivery,
          }),
          idempotencyReplayed: true,
        };
      }
      reservation = idempotency;

      const binding =
        await this.deferredSourceBindingStore.createSourceBindingWithoutCredential(
          {
            roomId,
            ownerProfileId: input.actor.profileId,
            worldId: request.world_id,
            domainAdapter: request.domain_adapter,
            sourceLabel: request.source_label,
            ttlMs: request.ttl_ms,
          },
        );
      committedBindingId = binding.binding_id;
      const delivery = await this.issueSourceCredentialDelivery({
        actor: input.actor,
        binding,
        credentialTtlMs: resolveSharedLiveRoomSourceCredentialTtlMs(
          input.actor,
          request.ttl_ms,
        ),
      });
      const receipt = this.sourceCreateReceipt({
        roomId,
        binding,
        delivery,
      });
      await this.completeIdempotency({
        actor: input.actor,
        operation: `${HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_CAPABILITY}:${roomId}`,
        ...reservation,
        receipt: this.durableSourceCreateReceipt({
          roomId,
          bindingId: binding.binding_id,
        }),
      });
      return { status: 201, body: receipt, idempotencyReplayed: false };
    } catch (error) {
      if (reservation) {
        const operation = `${HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_CAPABILITY}:${normalize(input.roomId)}`;
        if (committedBindingId) {
          await this.markIdempotencyOutcomeUnknown({
            actor: input.actor,
            operation,
            ...reservation,
            resourceRef: committedBindingId,
          }).catch(() => undefined);
        } else {
          await this.abandonIdempotency({
            actor: input.actor,
            operation,
            ...reservation,
          }).catch(() => undefined);
        }
      }
      throw normalizeControlError(error);
    }
  }
}
