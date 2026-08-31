import crypto from "node:crypto";
import {
  HELIX_LOCAL_SUPERVISOR_ADVISORY_AUDIENCE_SCHEMA,
  HELIX_LOCAL_SUPERVISOR_ADVISORY_DELIVERY_SCHEMA,
  HELIX_LOCAL_SUPERVISOR_ADVISORY_INERT_FIELDS,
  HELIX_LOCAL_SUPERVISOR_ADVISORY_SCHEMA,
  helixLocalSupervisorAdvisoryAckInputSchema,
  helixLocalSupervisorAdvisoryAudienceSchema,
  helixLocalSupervisorAdvisoryDeliverySchema,
  helixLocalSupervisorAdvisoryPublishInputSchema,
  helixLocalSupervisorAdvisorySchema,
  type HelixLocalSupervisorAdvisory,
  type HelixLocalSupervisorAdvisoryAudience,
  type HelixLocalSupervisorAdvisoryDelivery,
} from "@shared/helix-local-supervisor-advisory";

export type HelixAdvisoryEligibleClient = Readonly<{
  clientSessionRef: string;
  profileRef: string;
  authenticatedMcpClientRef: string;
  serviceInstanceRef: string;
  installedNodeRef: string;
  active: boolean;
  nodeActive: boolean;
  roomBindings: readonly Readonly<{
    roomRef: string;
    present: boolean;
    readGrantActive: boolean;
  }>[];
}>;

export type HelixAdvisoryPublisherAuthorization = Readonly<{
  basis: "server_verified";
  authorizationRef: string;
  authorityClass: "installed_node_owner" | "room_manager";
  publisherProfileRef: string;
  publisherClientSessionRef: string;
  publisherMcpClientRef: string;
  serviceInstanceRef: string;
  installedNodeRef: string;
  roomRef: string | null;
}>;

type StoredAdvisory = Readonly<{
  advisory: HelixLocalSupervisorAdvisory;
  audience: HelixLocalSupervisorAdvisoryAudience;
  replayHash: string;
}>;

export class HelixLocalSupervisorAdvisoryError extends Error {
  constructor(readonly code: string, readonly status: number) {
    super(code);
    this.name = "HelixLocalSupervisorAdvisoryError";
  }
}

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, stableValue(item)]));
  }
  return value;
};
const digest = (value: unknown): string => crypto.createHash("sha256")
  .update(JSON.stringify(stableValue(value)), "utf8").digest("hex");
const ref = (prefix: string, value: unknown): string =>
  `${prefix}:${digest(value).slice(0, 32)}`;
const clone = <T>(value: T): T => structuredClone(value);

export class HelixLocalSupervisorAdvisoryFanoutStore {
  private readonly advisories: StoredAdvisory[] = [];
  private readonly replay = new Map<string, StoredAdvisory>();
  private readonly deliveries = new Map<string, HelixLocalSupervisorAdvisoryDelivery>();

  constructor(private readonly dependencies: Readonly<{
    now?: () => Date;
    listClients: () => readonly HelixAdvisoryEligibleClient[];
    maxRecipients?: number;
    maxActiveAdvisories?: number;
    maxHistory?: number;
  }>) {
    const maxRecipients = dependencies.maxRecipients ?? 128;
    const maxActive = dependencies.maxActiveAdvisories ?? 32;
    const maxHistory = dependencies.maxHistory ?? 256;
    if (!Number.isInteger(maxRecipients) || maxRecipients < 1 || maxRecipients > 128) {
      throw new Error("Advisory recipient capacity must be 1-128.");
    }
    if (!Number.isInteger(maxActive) || maxActive < 1 || maxActive > 64) {
      throw new Error("Active advisory capacity must be 1-64.");
    }
    if (!Number.isInteger(maxHistory) || maxHistory < maxActive || maxHistory > 512) {
      throw new Error("Advisory history capacity must contain active capacity and be <= 512.");
    }
  }

  private now(): Date {
    return (this.dependencies.now ?? (() => new Date()))();
  }

  private maxRecipients(): number {
    return this.dependencies.maxRecipients ?? 128;
  }

  private maxActive(): number {
    return this.dependencies.maxActiveAdvisories ?? 32;
  }

  private maxHistory(): number {
    return this.dependencies.maxHistory ?? 256;
  }

  private currentClient(clientSessionRef: string): HelixAdvisoryEligibleClient | null {
    return this.dependencies.listClients().find((candidate) =>
      candidate.clientSessionRef === clientSessionRef) ?? null;
  }

  private eligibleFor(input: {
    client: HelixAdvisoryEligibleClient;
    audienceClass: "service_epoch" | "room";
    serviceInstanceRef: string;
    installedNodeRef: string;
    roomRef: string | null;
  }): boolean {
    const client = input.client;
    if (!client.active || !client.nodeActive) return false;
    if (input.audienceClass === "service_epoch") {
      return client.serviceInstanceRef === input.serviceInstanceRef &&
        client.installedNodeRef === input.installedNodeRef;
    }
    return Boolean(input.roomRef && client.roomBindings.some((binding) =>
      binding.roomRef === input.roomRef && binding.present &&
      binding.readGrantActive));
  }

  private requirePublisher(input: {
    parsed: ReturnType<typeof helixLocalSupervisorAdvisoryPublishInputSchema.parse>;
    authorization: HelixAdvisoryPublisherAuthorization;
  }): HelixAdvisoryEligibleClient {
    const { parsed, authorization } = input;
    if (
      authorization.basis !== "server_verified" ||
      authorization.publisherClientSessionRef !== parsed.publisher_client_session_ref ||
      authorization.serviceInstanceRef !== parsed.service_instance_ref ||
      authorization.installedNodeRef !== parsed.installed_node_ref ||
      authorization.roomRef !== parsed.room_ref ||
      (parsed.audience_class === "service_epoch" &&
        authorization.authorityClass !== "installed_node_owner") ||
      (parsed.audience_class === "room" &&
        authorization.authorityClass !== "room_manager")
    ) {
      throw new HelixLocalSupervisorAdvisoryError(
        "supervisor_advisory_authorization_mismatch", 403,
      );
    }
    const publisher = this.currentClient(parsed.publisher_client_session_ref);
    if (!publisher || !publisher.active || !publisher.nodeActive ||
      publisher.profileRef !== authorization.publisherProfileRef ||
      publisher.authenticatedMcpClientRef !== authorization.publisherMcpClientRef ||
      publisher.serviceInstanceRef !== authorization.serviceInstanceRef ||
      publisher.installedNodeRef !== authorization.installedNodeRef) {
      throw new HelixLocalSupervisorAdvisoryError(
        "supervisor_advisory_publisher_identity_mismatch", 403,
      );
    }
    if (parsed.audience_class === "room" && !publisher.roomBindings.some(
      (binding) => binding.roomRef === parsed.room_ref && binding.present &&
        binding.readGrantActive,
    )) {
      throw new HelixLocalSupervisorAdvisoryError(
        "supervisor_advisory_room_ineligible", 403,
      );
    }
    return publisher;
  }

  publish(input: {
    request: unknown;
    authorization: HelixAdvisoryPublisherAuthorization;
  }): Readonly<{
    advisory: HelixLocalSupervisorAdvisory;
    audience: HelixLocalSupervisorAdvisoryAudience;
    deliveries: HelixLocalSupervisorAdvisoryDelivery[];
  }> {
    const parsed = helixLocalSupervisorAdvisoryPublishInputSchema.parse(input.request);
    const publisher = this.requirePublisher({ parsed, authorization: input.authorization });
    const replayKey = `${publisher.profileRef}\n${publisher.clientSessionRef}\n${parsed.publisher_idempotency_ref}`;
    const replayHash = digest(parsed);
    const existing = this.replay.get(replayKey);
    if (existing) {
      if (existing.replayHash !== replayHash) {
        throw new HelixLocalSupervisorAdvisoryError(
          "supervisor_advisory_conflicting_replay", 409,
        );
      }
      return {
        advisory: clone(existing.advisory),
        audience: clone(existing.audience),
        deliveries: this.deliveriesFor(existing.advisory.advisory_ref),
      };
    }
    const now = this.now();
    const activeCount = this.advisories.filter((entry) =>
      Date.parse(entry.advisory.expires_at) > now.getTime()).length;
    if (activeCount >= this.maxActive()) {
      throw new HelixLocalSupervisorAdvisoryError(
        "supervisor_advisory_active_capacity_reached", 429,
      );
    }
    const recipients = this.dependencies.listClients()
      .filter((client) => this.eligibleFor({
        client,
        audienceClass: parsed.audience_class,
        serviceInstanceRef: parsed.service_instance_ref,
        installedNodeRef: parsed.installed_node_ref,
        roomRef: parsed.room_ref,
      }))
      .sort((left, right) => left.clientSessionRef.localeCompare(right.clientSessionRef));
    if (!recipients.length) {
      throw new HelixLocalSupervisorAdvisoryError(
        "supervisor_advisory_audience_empty", 409,
      );
    }
    if (recipients.length > this.maxRecipients()) {
      throw new HelixLocalSupervisorAdvisoryError(
        "supervisor_advisory_recipient_capacity_reached", 429,
      );
    }
    const audienceIdentity = {
      publisher: publisher.clientSessionRef,
      idempotency: parsed.publisher_idempotency_ref,
      recipients: recipients.map((client) => ({
        client: client.clientSessionRef,
        profile: client.profileRef,
        mcp: client.authenticatedMcpClientRef,
        service: client.serviceInstanceRef,
        node: client.installedNodeRef,
      })),
      resolvedAt: now.toISOString(),
    };
    const audienceSnapshotRef = ref("supervisor_advisory_audience", audienceIdentity);
    const audience = helixLocalSupervisorAdvisoryAudienceSchema.parse({
      schema: HELIX_LOCAL_SUPERVISOR_ADVISORY_AUDIENCE_SCHEMA,
      audience_snapshot_ref: audienceSnapshotRef,
      audience_class: parsed.audience_class,
      service_instance_ref: parsed.service_instance_ref,
      installed_node_ref: parsed.installed_node_ref,
      room_ref: parsed.room_ref,
      resolved_at: now.toISOString(),
      server_resolved: true,
      recipient_count: recipients.length,
      recipients: recipients.map((client) => ({
        client_session_ref: client.clientSessionRef,
        profile_ref: client.profileRef,
        authenticated_mcp_client_ref: client.authenticatedMcpClientRef,
        service_instance_ref: client.serviceInstanceRef,
        installed_node_ref: client.installedNodeRef,
        room_ref: parsed.room_ref,
      })),
      arbitrary_recipient_selection_allowed: false,
      ...HELIX_LOCAL_SUPERVISOR_ADVISORY_INERT_FIELDS,
    });
    const expiresAt = new Date(now.getTime() + parsed.expires_in_seconds * 1_000);
    const advisory = helixLocalSupervisorAdvisorySchema.parse({
      schema: HELIX_LOCAL_SUPERVISOR_ADVISORY_SCHEMA,
      advisory_ref: ref("supervisor_advisory", {
        audienceSnapshotRef,
        publisher: publisher.clientSessionRef,
        idempotency: parsed.publisher_idempotency_ref,
      }),
      publisher_idempotency_ref: parsed.publisher_idempotency_ref,
      publisher_profile_ref: publisher.profileRef,
      publisher_client_session_ref: publisher.clientSessionRef,
      publisher_mcp_client_ref: publisher.authenticatedMcpClientRef,
      publisher_authorization_ref: input.authorization.authorizationRef,
      audience_snapshot_ref: audienceSnapshotRef,
      audience_class: parsed.audience_class,
      service_instance_ref: parsed.service_instance_ref,
      installed_node_ref: parsed.installed_node_ref,
      room_ref: parsed.room_ref,
      summary: parsed.summary,
      advisory_basis: "owner_declared",
      measured_resource_evidence_included: false,
      late_attach_policy: parsed.late_attach_policy,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      recipient_count: recipients.length,
      content_role: "local_supervisor_owner_declared_advisory",
      ...HELIX_LOCAL_SUPERVISOR_ADVISORY_INERT_FIELDS,
    });
    const stored = { advisory, audience, replayHash };
    this.advisories.push(stored);
    this.replay.set(replayKey, stored);
    for (const recipient of recipients) this.createDelivery(stored, recipient, false);
    this.compact();
    return {
      advisory: clone(advisory),
      audience: clone(audience),
      deliveries: this.deliveriesFor(advisory.advisory_ref),
    };
  }

  reconcileLateAttach(client: HelixAdvisoryEligibleClient): HelixLocalSupervisorAdvisoryDelivery[] {
    const nowMs = this.now().getTime();
    for (const stored of this.advisories) {
      if (stored.advisory.late_attach_policy !== "eligible_until_expiry" ||
        Date.parse(stored.advisory.expires_at) <= nowMs ||
        !this.eligibleFor({
          client,
          audienceClass: stored.advisory.audience_class,
          serviceInstanceRef: stored.advisory.service_instance_ref,
          installedNodeRef: stored.advisory.installed_node_ref,
          roomRef: stored.advisory.room_ref,
        })) continue;
      this.createDelivery(stored, client, true);
    }
    return this.readInbox({
      clientSessionRef: client.clientSessionRef,
      profileRef: client.profileRef,
      authenticatedMcpClientRef: client.authenticatedMcpClientRef,
      serviceInstanceRef: client.serviceInstanceRef,
      installedNodeRef: client.installedNodeRef,
    });
  }

  readInbox(input: {
    clientSessionRef: string;
    profileRef: string;
    authenticatedMcpClientRef: string;
    serviceInstanceRef: string;
    installedNodeRef: string;
  }): HelixLocalSupervisorAdvisoryDelivery[] {
    const client = this.currentClient(input.clientSessionRef);
    if (!client || !client.active || !client.nodeActive ||
      client.profileRef !== input.profileRef ||
      client.authenticatedMcpClientRef !== input.authenticatedMcpClientRef ||
      client.serviceInstanceRef !== input.serviceInstanceRef ||
      client.installedNodeRef !== input.installedNodeRef) {
      throw new HelixLocalSupervisorAdvisoryError(
        "supervisor_advisory_recipient_identity_mismatch", 403,
      );
    }
    const nowMs = this.now().getTime();
    return [...this.deliveries.values()]
      .filter((delivery) => {
        if (delivery.recipient_client_session_ref !== client.clientSessionRef) return false;
        if (Date.parse(delivery.expires_at) <= nowMs) return false;
        const stored = this.advisories.find((entry) =>
          entry.advisory.advisory_ref === delivery.advisory_ref);
        return Boolean(stored && this.eligibleFor({
          client,
          audienceClass: stored.advisory.audience_class,
          serviceInstanceRef: stored.advisory.service_instance_ref,
          installedNodeRef: stored.advisory.installed_node_ref,
          roomRef: stored.advisory.room_ref,
        }));
      })
      .sort((left, right) => left.delivery_ref.localeCompare(right.delivery_ref))
      .slice(0, 100)
      .map((delivery) => helixLocalSupervisorAdvisoryDeliverySchema.parse({
        ...delivery,
        delivery_state: delivery.acknowledgement_ref
          ? "acknowledged"
          : "pending",
      }));
  }

  acknowledge(input: {
    deliveryRef: string;
    profileRef: string;
    authenticatedMcpClientRef: string;
    serviceInstanceRef: string;
    installedNodeRef: string;
    acknowledgement: unknown;
  }): HelixLocalSupervisorAdvisoryDelivery {
    const parsed = helixLocalSupervisorAdvisoryAckInputSchema.parse(input.acknowledgement);
    const client = this.currentClient(parsed.client_session_ref);
    if (!client || !client.active || !client.nodeActive ||
      client.profileRef !== input.profileRef ||
      client.authenticatedMcpClientRef !== input.authenticatedMcpClientRef ||
      client.serviceInstanceRef !== input.serviceInstanceRef ||
      client.installedNodeRef !== input.installedNodeRef) {
      throw new HelixLocalSupervisorAdvisoryError(
        "supervisor_advisory_recipient_identity_mismatch", 403,
      );
    }
    const storedDelivery = this.deliveries.get(input.deliveryRef);
    if (!storedDelivery ||
      storedDelivery.recipient_client_session_ref !== parsed.client_session_ref) {
      throw new HelixLocalSupervisorAdvisoryError(
        "supervisor_advisory_delivery_not_found", 404,
      );
    }
    if (Date.parse(storedDelivery.expires_at) <= this.now().getTime()) {
      throw new HelixLocalSupervisorAdvisoryError(
        "supervisor_advisory_delivery_expired", 409,
      );
    }
    const inbox = this.readInbox({
      clientSessionRef: parsed.client_session_ref,
      profileRef: input.profileRef,
      authenticatedMcpClientRef: input.authenticatedMcpClientRef,
      serviceInstanceRef: input.serviceInstanceRef,
      installedNodeRef: input.installedNodeRef,
    });
    const delivery = inbox.find((item) => item.delivery_ref === input.deliveryRef);
    if (!delivery) {
      throw new HelixLocalSupervisorAdvisoryError(
        "supervisor_advisory_delivery_not_found", 404,
      );
    }
    if (!delivery.acknowledgement_ref) {
      const acknowledged = helixLocalSupervisorAdvisoryDeliverySchema.parse({
        ...delivery,
        acknowledgement_ref: ref("supervisor_advisory_ack", {
          delivery: delivery.delivery_ref,
          client: parsed.client_session_ref,
        }),
        acknowledged_at: this.now().toISOString(),
        delivery_state: "acknowledged",
      });
      this.deliveries.set(acknowledged.delivery_ref, acknowledged);
    }
    return clone(this.deliveries.get(delivery.delivery_ref)!);
  }

  private createDelivery(
    stored: StoredAdvisory,
    recipient: HelixAdvisoryEligibleClient,
    lateAttach: boolean,
  ): void {
    const deliveryRef = ref("supervisor_advisory_delivery", {
      advisory: stored.advisory.advisory_ref,
      client: recipient.clientSessionRef,
      profile: recipient.profileRef,
      mcp: recipient.authenticatedMcpClientRef,
    });
    if (this.deliveries.has(deliveryRef)) return;
    this.deliveries.set(deliveryRef, helixLocalSupervisorAdvisoryDeliverySchema.parse({
      schema: HELIX_LOCAL_SUPERVISOR_ADVISORY_DELIVERY_SCHEMA,
      delivery_ref: deliveryRef,
      advisory_ref: stored.advisory.advisory_ref,
      audience_snapshot_ref: stored.audience.audience_snapshot_ref,
      recipient_client_session_ref: recipient.clientSessionRef,
      recipient_profile_ref: recipient.profileRef,
      recipient_mcp_client_ref: recipient.authenticatedMcpClientRef,
      recipient_service_instance_ref: recipient.serviceInstanceRef,
      recipient_installed_node_ref: recipient.installedNodeRef,
      room_ref: stored.advisory.room_ref,
      summary: stored.advisory.summary,
      advisory_basis: "owner_declared",
      measured_resource_evidence_included: false,
      late_attach: lateAttach,
      created_at: this.now().toISOString(),
      expires_at: stored.advisory.expires_at,
      acknowledgement_ref: null,
      acknowledged_at: null,
      delivery_state: "pending",
      content_role: "local_supervisor_recipient_advisory_delivery",
      ...HELIX_LOCAL_SUPERVISOR_ADVISORY_INERT_FIELDS,
    }));
  }

  private deliveriesFor(advisoryRef: string): HelixLocalSupervisorAdvisoryDelivery[] {
    return [...this.deliveries.values()]
      .filter((delivery) => delivery.advisory_ref === advisoryRef)
      .sort((left, right) => left.delivery_ref.localeCompare(right.delivery_ref))
      .map(clone);
  }

  private compact(): void {
    while (this.advisories.length > this.maxHistory()) {
      const evicted = this.advisories.shift();
      if (!evicted) break;
      for (const [key, value] of this.replay.entries()) {
        if (value.advisory.advisory_ref === evicted.advisory.advisory_ref) {
          this.replay.delete(key);
        }
      }
      for (const [key, delivery] of this.deliveries.entries()) {
        if (delivery.advisory_ref === evicted.advisory.advisory_ref) {
          this.deliveries.delete(key);
        }
      }
    }
  }
}
