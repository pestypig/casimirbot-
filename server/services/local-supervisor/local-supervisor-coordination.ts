import crypto from "node:crypto";
import {
  HELIX_LOCAL_SUPERVISOR_COORDINATION_SCHEMA,
  HELIX_LOCAL_SUPERVISOR_RECOMMENDATION_SCHEMA,
  HELIX_LOCAL_SUPERVISOR_RELAY_SCHEMA,
  helixLocalSupervisorPresenceInputSchema,
  helixLocalSupervisorRelayAckInputSchema,
  helixLocalSupervisorRelayInputSchema,
  helixLocalSupervisorResourceClaimSchema,
  type HelixLocalSupervisorPresence,
  type HelixLocalSupervisorRecommendation,
  type HelixLocalSupervisorRelay,
} from "@shared/helix-local-supervisor-coordination";

type PrivatePresence = HelixLocalSupervisorPresence & {
  accountSessionHash: string;
};

const digest = (value: string): string =>
  crypto.createHash("sha256").update(value, "utf8").digest("hex");
const clone = <T>(value: T): T =>
  typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value)) as T;
const publicPresence = ({ accountSessionHash: _private, ...entry }: PrivatePresence): HelixLocalSupervisorPresence => clone(entry);

export type HelixLocalSupervisorResourceClaimVerifier = (input: {
  serviceInstanceRef: string;
  authenticatedProfileRef: string;
  clientSessionRef: string;
  conversationThreadRef: string;
  resourceRef: string;
  claimClass: "read" | "retained_runtime" | "mutation_lease_wait" | "mutation_lease_active";
}) => { verificationRef: string } | null;

export type HelixLocalSupervisorVerifiedIdentity = Readonly<{
  room?: {
    roomRef: string;
    participantRef: string;
    verificationRef: string;
  };
  connector?: {
    environmentRef: string;
    connectorInstallationRef: string;
    sourceRef: string;
    producerEpochRef: string;
    verificationRef: string;
  };
  retainedRuntime?: {
    runRef: string;
    runVersion: number;
    runRoomBindingRef: string;
    runRoomBindingVersion: number;
    verificationRef: string;
  };
  executionLease?: {
    executionLeaseRef: string;
    workflowRef: string;
    actionAuthorityRef: string;
    participantRef: string;
    sourceRef: string;
    leaseExpiresAt: string;
    verificationRef: string;
  };
}>;

export class HelixLocalSupervisorCoordinationError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
  ) {
    super(code);
    this.name = "HelixLocalSupervisorCoordinationError";
  }
}

export class HelixLocalSupervisorCoordinationStore {
  private readonly presence = new Map<string, PrivatePresence>();
  private readonly relays: HelixLocalSupervisorRelay[] = [];
  private readonly relayKeys = new Map<string, HelixLocalSupervisorRelay>();
  private cursor = 0;

  constructor(
    readonly serviceInstanceRef: string,
    private readonly now: () => Date = () => new Date(),
    private readonly verifyResourceClaim?: HelixLocalSupervisorResourceClaimVerifier,
    private readonly maxClients = 256,
  ) {
    if (!Number.isInteger(maxClients) || maxClients < 2 || maxClients > 2_048) {
      throw new Error("Local-supervisor client capacity must be 2-2048.");
    }
  }

  private sessionHash(sessionId: string): string {
    return digest(sessionId);
  }

  private requireOwnedClient(input: {
    clientSessionRef: string;
    profileRef: string;
    accountSessionId: string;
  }): PrivatePresence {
    const entry = this.presence.get(input.clientSessionRef);
    if (!entry) throw new HelixLocalSupervisorCoordinationError("supervisor_client_not_registered", 404);
    if (
      entry.authenticated_profile_ref !== input.profileRef ||
      entry.accountSessionHash !== this.sessionHash(input.accountSessionId)
    ) throw new HelixLocalSupervisorCoordinationError("supervisor_client_identity_mismatch", 403);
    return entry;
  }

  authenticateClient(input: {
    clientSessionRef: string;
    profileRef: string;
    accountSessionId: string;
  }): HelixLocalSupervisorPresence {
    return publicPresence(this.requireOwnedClient(input));
  }

  registerOrHeartbeat(input: {
    profileRef: string;
    accountSessionId: string;
    /** Server-authenticated MCP client ref. Non-MCP callers leave this null. */
    authenticatedMcpClientRef?: string | null;
    presence: unknown;
    /** Server-owned proof refs; never populated from an HTTP/MCP request body. */
    verifiedResourceClaims?: ReadonlyMap<string, string>;
    /** Canonical identity projections; never populated from an HTTP/MCP body. */
    verifiedIdentity?: HelixLocalSupervisorVerifiedIdentity;
  }): HelixLocalSupervisorPresence {
    const parsed = helixLocalSupervisorPresenceInputSchema.parse(input.presence);
    const existing = this.presence.get(parsed.client_session_ref);
    if (!existing && this.presence.size >= this.maxClients) {
      const nowMs = this.now().getTime();
      const reclaimable = [...this.presence.values()]
        .filter((entry) => !entry.active ||
          Date.parse(entry.heartbeat_expires_at) <= nowMs)
        .sort((left, right) => Date.parse(left.observed_at) - Date.parse(right.observed_at));
      for (const entry of reclaimable) {
        this.presence.delete(entry.client_session_ref);
        if (this.presence.size < this.maxClients) break;
      }
      if (this.presence.size >= this.maxClients) {
        throw new HelixLocalSupervisorCoordinationError(
          "supervisor_client_capacity_reached",
          429,
        );
      }
    }
    const accountSessionHash = this.sessionHash(input.accountSessionId);
    if (existing && (
      existing.authenticated_profile_ref !== input.profileRef ||
      existing.accountSessionHash !== accountSessionHash ||
      existing.authenticated_mcp_client_ref !==
        (input.authenticatedMcpClientRef ?? null) ||
      existing.conversation_thread_ref !== parsed.conversation_thread_ref
    )) throw new HelixLocalSupervisorCoordinationError("supervisor_client_identity_mismatch", 403);
    const observedAt = this.now();
    const active = parsed.lifecycle_state !== "completed" && parsed.lifecycle_state !== "disconnected";
    const resourceClaims = active ? parsed.resource_claims.map((claim) => {
      const internallyVerified = input.verifiedResourceClaims?.get(
        `${claim.claim_class}\n${claim.resource_ref}`,
      );
      const verification = internallyVerified
        ? { verificationRef: internallyVerified }
        : this.verifyResourceClaim?.({
        serviceInstanceRef: this.serviceInstanceRef,
        authenticatedProfileRef: input.profileRef,
        clientSessionRef: parsed.client_session_ref,
        conversationThreadRef: parsed.conversation_thread_ref,
        resourceRef: claim.resource_ref,
        claimClass: claim.claim_class,
      }) ?? null;
      const protectedClaim = claim.claim_class === "retained_runtime" ||
        claim.claim_class === "mutation_lease_active";
      return helixLocalSupervisorResourceClaimSchema.parse({
        ...claim,
        claim_basis: verification ? "server_verified" : "client_declared",
        verification_ref: verification?.verificationRef ?? null,
        collision_authority: Boolean(verification && protectedClaim),
      });
    }) : [];
    const entry: PrivatePresence = {
      schema: HELIX_LOCAL_SUPERVISOR_COORDINATION_SCHEMA,
      service_instance_ref: this.serviceInstanceRef,
      client_session_ref: parsed.client_session_ref,
      conversation_thread_ref: parsed.conversation_thread_ref,
      authenticated_profile_ref: input.profileRef,
      authenticated_mcp_client_ref: input.authenticatedMcpClientRef ?? null,
      declared_objective_summary: parsed.declared_objective_summary,
      declared_objective_is_verified: false,
      lifecycle_basis: "authenticated_client_heartbeat",
      lifecycle_state: parsed.lifecycle_state,
      thread_observability_bridge: {
        ...parsed.thread_observability_bridge,
        declaration_basis: "authenticated_client_declaration",
        provider_thread_content_included: false,
        hidden_reasoning_included: false,
        answer_authority: false,
        terminal_eligible: false,
      },
      resource_claims: resourceClaims,
      room_ref: parsed.room_ref ?? null,
      environment_ref: parsed.environment_ref ?? null,
      run_ref: parsed.run_ref ?? null,
      verified_room_identity: input.verifiedIdentity?.room ? {
        basis: "server_verified",
        room_ref: input.verifiedIdentity.room.roomRef,
        participant_ref: input.verifiedIdentity.room.participantRef,
        verification_ref: input.verifiedIdentity.room.verificationRef,
      } : null,
      verified_connector_identity: input.verifiedIdentity?.connector ? {
        basis: "server_verified",
        environment_ref: input.verifiedIdentity.connector.environmentRef,
        connector_installation_ref:
          input.verifiedIdentity.connector.connectorInstallationRef,
        source_ref: input.verifiedIdentity.connector.sourceRef,
        producer_epoch_ref: input.verifiedIdentity.connector.producerEpochRef,
        verification_ref: input.verifiedIdentity.connector.verificationRef,
      } : null,
      verified_retained_runtime_identity:
        input.verifiedIdentity?.retainedRuntime ? {
          basis: "server_verified",
          run_ref: input.verifiedIdentity.retainedRuntime.runRef,
          run_version: input.verifiedIdentity.retainedRuntime.runVersion,
          run_room_binding_ref:
            input.verifiedIdentity.retainedRuntime.runRoomBindingRef,
          run_room_binding_version:
            input.verifiedIdentity.retainedRuntime.runRoomBindingVersion,
          verification_ref:
            input.verifiedIdentity.retainedRuntime.verificationRef,
        } : null,
      verified_execution_lease_identity:
        input.verifiedIdentity?.executionLease ? {
          basis: "server_verified",
          execution_lease_ref:
            input.verifiedIdentity.executionLease.executionLeaseRef,
          workflow_ref: input.verifiedIdentity.executionLease.workflowRef,
          action_authority_ref:
            input.verifiedIdentity.executionLease.actionAuthorityRef,
          participant_ref:
            input.verifiedIdentity.executionLease.participantRef,
          source_ref: input.verifiedIdentity.executionLease.sourceRef,
          lease_expires_at:
            input.verifiedIdentity.executionLease.leaseExpiresAt,
          verification_ref:
            input.verifiedIdentity.executionLease.verificationRef,
        } : null,
      blocker_summary: parsed.blocker_summary ?? null,
      observed_at: observedAt.toISOString(),
      heartbeat_expires_at: new Date(observedAt.getTime() + parsed.heartbeat_ttl_seconds * 1000).toISOString(),
      active,
      accountSessionHash,
      credential_included: false,
      private_endpoint_included: false,
      hidden_reasoning_included: false,
      native_account_identity_included: false,
      content_role: "supervisor_presence_advisory",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
    this.presence.set(entry.client_session_ref, entry);
    return publicPresence(entry);
  }

  listPresence(): HelixLocalSupervisorPresence[] {
    const nowMs = this.now().getTime();
    return [...this.presence.values()].map((entry) => {
      const active = entry.active &&
        Date.parse(entry.heartbeat_expires_at) > nowMs;
      return publicPresence({
        ...entry,
        active,
        resource_claims: active ? entry.resource_claims : [],
        verified_room_identity: active ? entry.verified_room_identity : null,
        verified_connector_identity:
          active ? entry.verified_connector_identity : null,
        verified_retained_runtime_identity:
          active ? entry.verified_retained_runtime_identity : null,
        verified_execution_lease_identity:
          active ? entry.verified_execution_lease_identity : null,
      });
    }).sort((left, right) =>
      left.client_session_ref.localeCompare(right.client_session_ref));
  }

  listRecommendations(): HelixLocalSupervisorRecommendation[] {
    const active = this.listPresence().filter((entry) => entry.active);
    const byResource = new Map<string, Array<{
      presence: HelixLocalSupervisorPresence;
      claim: HelixLocalSupervisorPresence["resource_claims"][number];
    }>>();
    for (const presence of active) {
      for (const claim of presence.resource_claims) {
        const claims = byResource.get(claim.resource_ref) ?? [];
        claims.push({ presence, claim });
        byResource.set(claim.resource_ref, claims);
      }
    }
    const derivedAt = this.now().toISOString();
    const recommendations: HelixLocalSupervisorRecommendation[] = [];
    const add = (input: Omit<HelixLocalSupervisorRecommendation,
      "schema" | "recommendation_ref" | "service_instance_ref" | "derived_at" |
      "advisory_only" | "automatically_published" | "execution_requested" |
      "authority_transfer" | "evidence_satisfied" | "credential_included" |
      "private_endpoint_included" | "hidden_reasoning_included" | "content_role" |
      "answer_authority" | "assistant_answer" | "terminal_eligible" |
      "raw_content_included"
    >): void => {
      const identity = [
        this.serviceInstanceRef,
        input.source_client_session_ref,
        input.target_client_session_ref,
        input.resource_ref,
        input.reason_code,
      ].join("\n");
      recommendations.push({
        schema: HELIX_LOCAL_SUPERVISOR_RECOMMENDATION_SCHEMA,
        recommendation_ref: `supervisor_recommendation:${digest(identity).slice(0, 32)}`,
        service_instance_ref: this.serviceInstanceRef,
        ...input,
        derived_at: derivedAt,
        advisory_only: true,
        automatically_published: false,
        execution_requested: false,
        authority_transfer: false,
        evidence_satisfied: false,
        credential_included: false,
        private_endpoint_included: false,
        hidden_reasoning_included: false,
        content_role: "supervisor_coordination_recommendation_advisory",
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      });
    };
    for (const [resourceRef, entries] of [...byResource.entries()]
      .sort(([left], [right]) => left.localeCompare(right))) {
      const verifiedRetainers = entries.filter(({ claim }) =>
        claim.claim_class === "retained_runtime" && claim.collision_authority);
      const verifiedMutationHolders = entries.filter(({ claim }) =>
        claim.claim_class === "mutation_lease_active" && claim.collision_authority);
      const waiters = entries.filter(({ claim }) => claim.claim_class === "mutation_lease_wait");
      const addCollision = (
        holders: typeof entries,
        reasonCode: HelixLocalSupervisorRecommendation["reason_code"],
      ): void => {
        if (holders.length < 2) return;
        const sorted = [...holders].sort((left, right) =>
          left.presence.client_session_ref.localeCompare(right.presence.client_session_ref));
        add({
          source_client_session_ref: sorted[1].presence.client_session_ref,
          target_client_session_ref: sorted[0].presence.client_session_ref,
          resource_ref: resourceRef,
          recommended_relay_type: "collision_notice",
          reason_code: reasonCode,
          supporting_verification_refs: sorted
            .map(({ claim }) => claim.verification_ref)
            .filter((value): value is string => Boolean(value))
            .sort((left, right) => left.localeCompare(right)),
        });
      };
      addCollision(verifiedRetainers, "multiple_verified_retained_runtime_owners");
      addCollision(verifiedMutationHolders, "multiple_verified_mutation_lease_holders");
      const verifiedOwners = [...verifiedRetainers, ...verifiedMutationHolders]
        .sort((left, right) => left.presence.client_session_ref
          .localeCompare(right.presence.client_session_ref));
      if (verifiedOwners.length === 1) {
        for (const waiter of waiters.sort((left, right) =>
          left.presence.client_session_ref.localeCompare(right.presence.client_session_ref))) {
          if (waiter.presence.client_session_ref ===
              verifiedOwners[0].presence.client_session_ref) continue;
          add({
            source_client_session_ref: waiter.presence.client_session_ref,
            target_client_session_ref: verifiedOwners[0].presence.client_session_ref,
            resource_ref: resourceRef,
            recommended_relay_type: "handoff_request",
            reason_code: "waiting_for_verified_resource_owner",
            supporting_verification_refs: [verifiedOwners[0].claim.verification_ref!],
          });
        }
      }
    }
    return recommendations.sort((left, right) =>
      left.recommendation_ref.localeCompare(right.recommendation_ref));
  }

  disconnect(input: { profileRef: string; accountSessionId: string; clientSessionRef: string }): HelixLocalSupervisorPresence {
    const entry = this.requireOwnedClient(input);
    const now = this.now().toISOString();
    const disconnected: PrivatePresence = {
      ...entry,
      lifecycle_state: "disconnected",
      resource_claims: [],
      verified_room_identity: null,
      verified_connector_identity: null,
      verified_retained_runtime_identity: null,
      verified_execution_lease_identity: null,
      active: false,
      observed_at: now,
      heartbeat_expires_at: now,
    };
    this.presence.set(entry.client_session_ref, disconnected);
    return publicPresence(disconnected);
  }

  publishRelay(input: { profileRef: string; accountSessionId: string; relay: unknown }): HelixLocalSupervisorRelay {
    const parsed = helixLocalSupervisorRelayInputSchema.parse(input.relay);
    this.requireOwnedClient({
      clientSessionRef: parsed.sender_client_session_ref,
      profileRef: input.profileRef,
      accountSessionId: input.accountSessionId,
    });
    const target = this.presence.get(parsed.target_client_session_ref);
    if (!target || !target.active || Date.parse(target.heartbeat_expires_at) <= this.now().getTime()) {
      throw new HelixLocalSupervisorCoordinationError("supervisor_relay_target_inactive", 409);
    }
    const dedupeKey = `${parsed.sender_client_session_ref}\n${parsed.client_message_ref}`;
    const replay = this.relayKeys.get(dedupeKey);
    if (replay) return clone(replay);
    const createdAt = this.now();
    const relay: HelixLocalSupervisorRelay = {
      schema: HELIX_LOCAL_SUPERVISOR_RELAY_SCHEMA,
      service_instance_ref: this.serviceInstanceRef,
      cursor: ++this.cursor,
      message_ref: `supervisor_relay:${digest(`${this.serviceInstanceRef}\n${this.cursor}\n${dedupeKey}`).slice(0, 32)}`,
      client_message_ref: parsed.client_message_ref,
      sender_client_session_ref: parsed.sender_client_session_ref,
      sender_profile_ref: input.profileRef,
      target_client_session_ref: parsed.target_client_session_ref,
      relay_type: parsed.relay_type,
      summary: parsed.summary,
      resource_ref: parsed.resource_ref ?? null,
      room_ref: parsed.room_ref ?? null,
      run_ref: parsed.run_ref ?? null,
      created_at: createdAt.toISOString(),
      expires_at: new Date(createdAt.getTime() + parsed.expires_in_seconds * 1000).toISOString(),
      acknowledgement_ref: null,
      acknowledged_at: null,
      delivery_state: "pending",
      advisory_only: true,
      execution_requested: false,
      authority_transfer: false,
      evidence_satisfied: false,
      credential_included: false,
      private_endpoint_included: false,
      hidden_reasoning_included: false,
      content_role: "supervisor_relay_advisory",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
    this.relays.push(relay);
    this.relayKeys.set(dedupeKey, relay);
    while (this.relays.length > 300) {
      const evicted = this.relays.shift();
      if (evicted) {
        this.relayKeys.delete(
          `${evicted.sender_client_session_ref}\n${evicted.client_message_ref}`,
        );
      }
    }
    return clone(relay);
  }

  listRelays(input: { clientSessionRef: string; profileRef: string; accountSessionId: string; afterCursor?: number }): HelixLocalSupervisorRelay[] {
    this.requireOwnedClient(input);
    const nowMs = this.now().getTime();
    return this.relays
      .filter((relay) => relay.cursor > (input.afterCursor ?? 0) && (
        relay.sender_client_session_ref === input.clientSessionRef ||
        relay.target_client_session_ref === input.clientSessionRef
      ))
      .slice(0, 100)
      .map((relay) => clone({
        ...relay,
        delivery_state: relay.acknowledgement_ref
          ? "acknowledged"
          : Date.parse(relay.expires_at) <= nowMs
            ? "expired"
            : "pending",
      }));
  }

  acknowledgeRelay(input: { profileRef: string; accountSessionId: string; messageRef: string; acknowledgement: unknown }): HelixLocalSupervisorRelay {
    const parsed = helixLocalSupervisorRelayAckInputSchema.parse(input.acknowledgement);
    this.requireOwnedClient({
      clientSessionRef: parsed.client_session_ref,
      profileRef: input.profileRef,
      accountSessionId: input.accountSessionId,
    });
    const index = this.relays.findIndex((relay) => relay.message_ref === input.messageRef);
    if (index < 0) throw new HelixLocalSupervisorCoordinationError("supervisor_relay_not_found", 404);
    const relay = this.relays[index];
    if (relay.target_client_session_ref !== parsed.client_session_ref) {
      throw new HelixLocalSupervisorCoordinationError("supervisor_relay_ack_forbidden", 403);
    }
    if (Date.parse(relay.expires_at) <= this.now().getTime()) {
      throw new HelixLocalSupervisorCoordinationError("supervisor_relay_expired", 409);
    }
    if (!relay.acknowledgement_ref) {
      const acknowledgedAt = this.now().toISOString();
      const updated: HelixLocalSupervisorRelay = {
        ...relay,
        acknowledgement_ref: `supervisor_relay_ack:${digest(`${relay.message_ref}\n${parsed.client_session_ref}`).slice(0, 32)}`,
        acknowledged_at: acknowledgedAt,
        delivery_state: "acknowledged",
      };
      this.relays[index] = updated;
      this.relayKeys.set(`${relay.sender_client_session_ref}\n${relay.client_message_ref}`, updated);
    }
    return clone(this.relays[index]);
  }
}
