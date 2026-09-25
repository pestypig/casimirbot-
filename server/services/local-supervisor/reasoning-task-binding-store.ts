import crypto from "node:crypto";
import { acceptPairingLedgerRow, pairingLedgerRowSchema, pairingState, type PairingLedgerRow, type PairingDestination } from "./pairing-ledger-contract";
import {
  HELIX_REASONING_STEERING_EVENT_SCHEMA,
  HELIX_REASONING_TASK_BINDING_SCHEMA,
  helixReasoningSteeringEventProjectionSchema,
  helixReasoningTaskBindingProjectionSchema,
  type HelixReasoningSteeringDelivery,
  type HelixReasoningSteeringEventProjection,
  type HelixReasoningTaskBindingProjection,
} from "@shared/helix-reasoning-task-binding";
import type { HelixLocalSupervisorPresence } from
  "@shared/helix-local-supervisor-coordination";
import { roomMissionSteeringEnvelopeSchema,
  type RoomMissionSteeringEnvelope } from "./room-mission-steering";

const digest = (value: string): string =>
  crypto.createHash("sha256").update(value, "utf8").digest("hex");
const clone = <T>(value: T): T => structuredClone(value);
const CLAIM_HANDLE_PATTERN =
  /^reasoning_claim:([a-f0-9]{16}):[A-Za-z0-9_-]{32}$/u;

type PresencePort = Readonly<{
  serviceInstanceRef: string;
  listPresence(): HelixLocalSupervisorPresence[];
}>;
type PrivateBinding = HelixReasoningTaskBindingProjection & {
  claimHandleHash: string;
  durablePairingId?: string;
  durableDestination?: PairingDestination;
};
type PrivateEvent = HelixReasoningSteeringEventProjection & {
  instructionText: string;
  roomMission?: RoomMissionSteeringEnvelope;
};

export type HelixReasoningTaskAssociation = {
  profileRef: string; authenticatedMcpClientRef: string; clientSessionRef: string;
  clientContinuationRef: string; bindingId: string; bindingEpoch: number;
  helixConversationId: string; missionId: string | null; runId: string | null;
};

export class HelixReasoningTaskBindingError extends Error {
  constructor(readonly code: string, readonly status: number) {
    super(code);
    this.name = "HelixReasoningTaskBindingError";
  }
}

export class HelixReasoningTaskBindingStore {
  private readonly bindings = new Map<string, PrivateBinding>();
  private readonly claimHandles = new Map<string, string>();
  private readonly events: PrivateEvent[] = [];
  private readonly eventDedupe = new Map<string, string>();
  private bindingEpoch = 0;
  private cursor = 0;
  private readonly admittedDurableBindings = new Set<string>();

  constructor(
    private readonly presence: PresencePort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private serviceEpochTag(): string {
    // The service reference is already a non-secret projection. Its short
    // digest lets a replacement service distinguish a stale show-once value
    // without retaining or disclosing the private handle.
    return digest(this.presence.serviceInstanceRef).slice(0, 16);
  }

  private currentBinding(bindingId: string): PrivateBinding {
    const binding = this.bindings.get(bindingId);
    if (!binding) throw new HelixReasoningTaskBindingError("reasoning_binding_not_found", 404);
    if (binding.durablePairingId && !this.admittedDurableBindings.has(bindingId)) {
      throw new HelixReasoningTaskBindingError("reasoning_binding_durable_preflight_required", 409);
    }
    if ((binding.status === "pending_claim" || (binding.durablePairingId && binding.status === "active")) &&
        Date.parse(binding.expires_at) <= this.now().getTime()) {
      const expired = { ...binding, status: "expired" as const };
      this.bindings.set(bindingId, expired);
      return expired;
    }
    return binding;
  }

  /** Internal lookup only, not proof of a current grant or provider presence. */
  findOwnedBindingId(input: { profileRef: string; helixConversationId?: string }) {
    const binding = [...this.bindings.values()].filter(row => row.authenticated_profile_ref === input.profileRef &&
      (input.helixConversationId === undefined || row.helix_conversation_id === input.helixConversationId))
      .sort((left, right) => right.binding_epoch - left.binding_epoch)[0];
    if (!binding) throw new HelixReasoningTaskBindingError("reasoning_binding_not_found", 404);
    return binding.reasoning_binding_id;
  }

  /** Internal lookup only, not proof of a current grant or provider presence. */
  resolveDurableBindingContext(input: { profileRef: string; bindingId: string }) {
    const binding = this.bindings.get(input.bindingId);
    if (!binding) throw new HelixReasoningTaskBindingError("reasoning_binding_not_found", 404);
    if (binding.authenticated_profile_ref !== input.profileRef) {
      throw new HelixReasoningTaskBindingError("reasoning_binding_identity_mismatch", 403);
    }
    if (!binding.durablePairingId) return null;
    if (!binding.durableDestination) throw new HelixReasoningTaskBindingError("pairing_destination_required", 409);
    return { pairingId: binding.durablePairingId, destination: clone(binding.durableDestination),
      clientSessionRef: binding.client_session_ref };
  }

  /** Apply only a revocation already committed by the authenticated ledger path. */
  applyDurableRevocation(input: { profileRef: string; bindingId: string }, raw: PairingLedgerRow) {
    const context = this.resolveDurableBindingContext(input);
    const row = pairingLedgerRowSchema.parse(raw);
    const binding = this.bindings.get(input.bindingId)!;
    if (!context || row.id !== context.pairingId || pairingState(row, this.now()) !== "revoked" ||
        (Object.keys(context.destination) as Array<keyof PairingDestination>)
          .some(key => context.destination[key] !== row.approval.destination[key]) ||
        row.approval.chatId !== binding.helix_conversation_id ||
        (row.approval.environment?.runId ?? null) !== binding.run_id || row.pairingExpiresAt !== binding.expires_at) {
      throw new HelixReasoningTaskBindingError("pairing_revocation_identity_mismatch", 409);
    }
    const revoked = { ...binding, status: "revoked" as const, revoked_at: row.revokedAt };
    this.bindings.set(input.bindingId, revoked);
    return this.projectBinding(revoked);
  }

  /** Server-internal bridge. The reader must authenticate and freshly read the
   * durable grant on every invocation. No cached projection authorizes a call.
   * The operation is synchronous so the checked grant cannot survive an await. */
  async withAcceptedPairing<T>(input: {
    destination: PairingDestination; clientSessionRef: string;
    readAccepted: () => Promise<PairingLedgerRow>;
  }, operation: (binding: HelixReasoningTaskBindingProjection) => T): Promise<T> {
    const row = await input.readAccepted();
    const checked = acceptPairingLedgerRow(row, input.destination, this.now());
    if (!row.acceptedAt || checked.revision !== row.revision) {
      throw new HelixReasoningTaskBindingError("pairing_not_accepted", 409);
    }
    const bindingId = `reasoning_binding:${digest(JSON.stringify([
      this.presence.serviceInstanceRef, row.id, input.clientSessionRef,
    ])).slice(0, 32)}`;
    const prior = this.bindings.get(bindingId);
    if (prior && prior.status !== "active") {
      throw new HelixReasoningTaskBindingError(`reasoning_binding_${prior.status}`, 409);
    }
    const target = this.presence.listPresence().find(entry => entry.active &&
      entry.service_instance_ref === this.presence.serviceInstanceRef &&
      entry.authenticated_profile_ref === input.destination.profileId &&
      entry.authenticated_mcp_client_ref === input.destination.clientId &&
      entry.conversation_thread_ref === input.destination.taskId &&
      entry.client_session_ref === input.clientSessionRef &&
      Date.parse(entry.observed_at) <= this.now().getTime() &&
      Date.parse(entry.heartbeat_expires_at) > this.now().getTime());
    const bridge = target?.thread_observability_bridge;
    const level = bridge && bridge.supported_levels.includes(bridge.requested_level)
      ? bridge.requested_level : "tool_activity_only";
    const binding: PrivateBinding = {
      schema: HELIX_REASONING_TASK_BINDING_SCHEMA, reasoning_binding_id: bindingId,
      binding_epoch: prior?.binding_epoch ?? ++this.bindingEpoch, status: "active",
      service_instance_ref: this.presence.serviceInstanceRef,
      authenticated_profile_ref: input.destination.profileId,
      authenticated_mcp_client_ref: input.destination.clientId,
      client_session_ref: input.clientSessionRef, provider_thread_ref_hash: digest(input.destination.taskId),
      helix_conversation_id: row.approval.chatId, mission_id: null,
      run_id: row.approval.environment?.runId ?? null, reasoning_role: "principal",
      // The destination accepted this finite exact-chat MCP steering grant.
      // Its read/ack queue is available independently of optional public
      // checkpoints. This says nothing about idle wake or automatic delivery.
      continuation_transport: "polling",
      negotiated_observability_level: level, created_by: "signed_in_operator",
      created_at: row.createdAt, expires_at: row.pairingExpiresAt, claimed_at: row.acceptedAt,
      revoked_at: null, provider_thread_content_included: false, hidden_reasoning_included: false,
      execution_authority: false, evidence_authority: false, answer_authority: false, terminal_eligible: false,
      claimHandleHash: "", durablePairingId: row.id, durableDestination: clone(input.destination),
    };
    const projection = this.projectBinding(binding);
    this.bindings.set(bindingId, binding);
    this.admittedDurableBindings.add(bindingId);
    try {
      const result = operation(projection);
      if (result && typeof (result as { then?: unknown }).then === "function") {
        throw new HelixReasoningTaskBindingError("reasoning_binding_async_operation_forbidden", 500);
      }
      return result;
    } finally { this.admittedDurableBindings.delete(bindingId); }
  }

  private requireActiveOwnedBinding(input: {
    bindingId: string;
    bindingEpoch: number;
    profileRef: string;
    clientSessionRef?: string;
  }): PrivateBinding {
    const binding = this.currentBinding(input.bindingId);
    if (binding.authenticated_profile_ref !== input.profileRef) {
      throw new HelixReasoningTaskBindingError("reasoning_binding_identity_mismatch", 403);
    }
    if (input.clientSessionRef && binding.client_session_ref !== input.clientSessionRef) {
      throw new HelixReasoningTaskBindingError("reasoning_binding_identity_mismatch", 403);
    }
    if (binding.binding_epoch !== input.bindingEpoch) {
      throw new HelixReasoningTaskBindingError("reasoning_binding_epoch_mismatch", 409);
    }
    if (binding.status !== "active") {
      throw new HelixReasoningTaskBindingError(`reasoning_binding_${binding.status}`, 409);
    }
    return binding;
  }

  issueClaim(input: {
    profileRef: string;
    clientSessionRef: string;
    helixConversationId: string;
    missionId?: string | null;
    runId?: string | null;
    expiresInSeconds?: number;
  }): { claim_handle: string; binding: HelixReasoningTaskBindingProjection } {
    const target = this.presence.listPresence().find((entry) =>
      entry.active &&
      entry.service_instance_ref === this.presence.serviceInstanceRef &&
      entry.authenticated_profile_ref === input.profileRef &&
      entry.client_session_ref === input.clientSessionRef &&
      Boolean(entry.authenticated_mcp_client_ref));
    if (!target?.authenticated_mcp_client_ref) {
      throw new HelixReasoningTaskBindingError("reasoning_binding_target_inactive", 409);
    }
    const existing = [...this.bindings.values()].filter((entry) =>
      entry.authenticated_profile_ref === input.profileRef &&
      entry.helix_conversation_id === input.helixConversationId &&
      ["pending_claim", "active"].includes(entry.status));
    const createdAt = this.now();
    const claimHandle =
      `reasoning_claim:${this.serviceEpochTag()}:` +
      crypto.randomBytes(24).toString("base64url");
    const bindingEpoch = this.bindingEpoch + 1;
    const bindingId = `reasoning_binding:${digest([
      this.presence.serviceInstanceRef,
      input.profileRef,
      input.clientSessionRef,
      input.helixConversationId,
      bindingEpoch,
    ].join("\n")).slice(0, 32)}`;
    const level = target.thread_observability_bridge?.requested_level ?? "tool_activity_only";
    const continuation = level === "continuation_ready"
      ? "polling"
      : level === "checkpoint_publish" ? "monitor_only" : "unavailable";
    const binding: PrivateBinding = {
      schema: HELIX_REASONING_TASK_BINDING_SCHEMA,
      reasoning_binding_id: bindingId,
      binding_epoch: bindingEpoch,
      status: "pending_claim",
      service_instance_ref: this.presence.serviceInstanceRef,
      authenticated_profile_ref: input.profileRef,
      authenticated_mcp_client_ref: target.authenticated_mcp_client_ref,
      client_session_ref: target.client_session_ref,
      provider_thread_ref_hash: digest(target.conversation_thread_ref),
      helix_conversation_id: input.helixConversationId,
      mission_id: input.missionId ?? null,
      run_id: input.runId ?? null,
      reasoning_role: "principal",
      continuation_transport: continuation,
      negotiated_observability_level: level,
      created_by: "signed_in_operator",
      created_at: createdAt.toISOString(),
      expires_at: new Date(createdAt.getTime() + Math.min(300, Math.max(30, input.expiresInSeconds ?? 120)) * 1_000).toISOString(),
      claimed_at: null,
      revoked_at: null,
      provider_thread_content_included: false,
      hidden_reasoning_included: false,
      execution_authority: false,
      evidence_authority: false,
      answer_authority: false,
      terminal_eligible: false,
      claimHandleHash: digest(claimHandle),
    };
    this.projectBinding(binding);
    // Validate the complete replacement before changing a healthy binding or
    // consuming an epoch. Rejected drafts must leave the current chat usable.
    for (const prior of existing) {
      this.bindings.set(prior.reasoning_binding_id, {
        ...prior,
        status: "superseded",
        revoked_at: createdAt.toISOString(),
      });
    }
    this.bindingEpoch = bindingEpoch;
    this.bindings.set(bindingId, binding);
    this.claimHandles.set(binding.claimHandleHash, bindingId);
    return { claim_handle: claimHandle, binding: this.projectBinding(binding) };
  }

  claim(input: {
    profileRef: string;
    authenticatedMcpClientRef: string;
    clientSessionRef: string;
    claimHandle: string;
  }): HelixReasoningTaskBindingProjection {
    const encodedEpoch = CLAIM_HANDLE_PATTERN.exec(input.claimHandle)?.[1];
    if (encodedEpoch && encodedEpoch !== this.serviceEpochTag()) {
      throw new HelixReasoningTaskBindingError(
        "reasoning_binding_claim_service_epoch_mismatch",
        409,
      );
    }
    const handleHash = digest(input.claimHandle);
    const bindingId = this.claimHandles.get(handleHash);
    if (!bindingId) throw new HelixReasoningTaskBindingError("reasoning_binding_claim_invalid", 404);
    const binding = this.currentBinding(bindingId);
    if (binding.status !== "pending_claim") {
      throw new HelixReasoningTaskBindingError("reasoning_binding_claim_replayed", 409);
    }
    if (
      binding.authenticated_profile_ref !== input.profileRef ||
      binding.authenticated_mcp_client_ref !== input.authenticatedMcpClientRef ||
      binding.client_session_ref !== input.clientSessionRef
    ) throw new HelixReasoningTaskBindingError("reasoning_binding_identity_mismatch", 403);
    const updated: PrivateBinding = {
      ...binding,
      status: "active",
      claimed_at: this.now().toISOString(),
    };
    this.claimHandles.delete(handleHash);
    this.bindings.set(bindingId, updated);
    return this.projectBinding(updated);
  }

  validateSteeringTarget(input: { profileRef: string; bindingId: string; bindingEpoch: number; clientSessionRef?: string }) {
    return this.projectBinding(this.requireActiveOwnedBinding(input));
  }

  dispatch(input: {
    profileRef: string;
    bindingId: string;
    bindingEpoch: number;
    clientEventRef: string;
    origin: "typed" | "gpt_live_finalized" | "agent_submitted";
    instructionText: string;
    expiresInSeconds?: number;
    roomMission?: RoomMissionSteeringEnvelope;
  }): HelixReasoningSteeringEventProjection {
    const binding = this.requireActiveOwnedBinding(input);
    const instruction = input.instructionText.trim();
    if (!instruction || instruction.length > 4_000) {
      throw new HelixReasoningTaskBindingError("reasoning_steering_invalid_instruction", 400);
    }
    const dedupeKey = `${binding.reasoning_binding_id}\n${input.clientEventRef}`;
    const replayRef = this.eventDedupe.get(dedupeKey);
    const lifetimeMs = Math.min(3_600, Math.max(30, input.expiresInSeconds ?? 600)) * 1_000;
    if (replayRef) {
      const prior = this.events.find((event) => event.steering_event_ref === replayRef);
      if (!prior || prior.instruction_sha256 !== digest(instruction) || prior.origin !== input.origin ||
          Date.parse(prior.expires_at) - Date.parse(prior.created_at) !== lifetimeMs ||
          JSON.stringify(prior.roomMission ?? null) !== JSON.stringify(input.roomMission ?? null)) {
        throw new HelixReasoningTaskBindingError("reasoning_steering_request_conflict", 409);
      }
      return this.inspectEvent({ ...input, eventRef: prior.steering_event_ref });
    }
    const createdAt = this.now();
    const cursor = ++this.cursor;
    const event: PrivateEvent = {
      schema: HELIX_REASONING_STEERING_EVENT_SCHEMA,
      steering_event_ref: `reasoning_steering:${digest(`${dedupeKey}\n${cursor}`).slice(0, 32)}`,
      reasoning_binding_id: binding.reasoning_binding_id,
      binding_epoch: binding.binding_epoch,
      cursor,
      client_event_ref: input.clientEventRef,
      origin: input.origin,
      delivery_state: "pending",
      instruction_sha256: digest(instruction),
      instruction_length: instruction.length,
      created_at: createdAt.toISOString(),
      expires_at: new Date(createdAt.getTime() + lifetimeMs).toISOString(),
      acknowledged_at: null,
      advisory_only: true,
      execution_requested: false,
      evidence_satisfied: false,
      provider_thread_content_included: false,
      hidden_reasoning_included: false,
      answer_authority: false,
      terminal_eligible: false,
      instructionText: instruction,
      ...(input.roomMission ? { roomMission: roomMissionSteeringEnvelopeSchema.parse(input.roomMission) } : {}),
    };
    this.projectEvent(event);
    this.events.push(event);
    this.eventDedupe.set(dedupeKey, event.steering_event_ref);
    return this.projectEvent(event);
  }

  read(input: {
    profileRef: string;
    clientSessionRef: string;
    bindingId: string;
    bindingEpoch: number;
    afterCursor?: number;
  }): HelixReasoningSteeringDelivery[] {
    const binding = this.requireActiveOwnedBinding(input);
    return this.projectDeliveries(binding, input.afterCursor ?? 0);
  }

  /** Provider pickup must prove the calling task, not merely its client session. */
  readForTask(input: HelixReasoningTaskAssociation & { afterCursor?: number }): HelixReasoningSteeringDelivery[] {
    this.verifyTaskAssociation(input);
    return this.read(input);
  }

  /** Internal-only envelope lookup. Public event projections omit room control state. */
  readRoomMissionEnvelope(input: { profileRef: string; bindingId: string;
    bindingEpoch: number; eventRef: string }): RoomMissionSteeringEnvelope | null {
    this.requireActiveOwnedBinding(input);
    const event = this.events.find(row => row.steering_event_ref === input.eventRef &&
      row.reasoning_binding_id === input.bindingId && row.binding_epoch === input.bindingEpoch);
    if (!event) throw new HelixReasoningTaskBindingError("reasoning_steering_not_found", 404);
    return event.roomMission ? clone(event.roomMission) : null;
  }

  /** Owner display only. Does not authenticate as the provider or acknowledge pickup. */
  readForChatDisplay(input: {
    profileRef: string; bindingId: string; bindingEpoch: number;
    helixConversationId: string; runId: string | null; afterCursor?: number;
  }): HelixReasoningSteeringDelivery[] {
    const binding = this.requireActiveOwnedBinding(input);
    if (binding.helix_conversation_id !== input.helixConversationId || binding.run_id !== input.runId) {
      throw new HelixReasoningTaskBindingError("reasoning_binding_identity_mismatch", 409);
    }
    return this.projectDeliveries(binding, input.afterCursor ?? 0, true);
  }

  private projectDeliveries(binding: PrivateBinding, afterCursor: number, recent = false): HelixReasoningSteeringDelivery[] {
    const nowMs = this.now().getTime();
    return this.events.filter((event) =>
      event.reasoning_binding_id === binding.reasoning_binding_id &&
      event.binding_epoch === binding.binding_epoch &&
      event.cursor > afterCursor)
      .slice(recent ? -50 : 0, recent ? undefined : 50)
      .map((event) => ({
        event: this.projectEvent({
          ...event,
          delivery_state: event.acknowledged_at
            ? "acknowledged"
            : Date.parse(event.expires_at) <= nowMs ? "expired" : event.delivery_state,
        }),
        instruction_text: event.instructionText,
        content_role: event.origin === "agent_submitted"
          ? "agent_steering_advisory_not_execution" : "operator_steering_advisory_not_execution",
        raw_provider_content_included: false,
        hidden_reasoning_included: false,
      }));
  }

  acknowledge(input: {
    profileRef: string;
    clientSessionRef: string;
    bindingId: string;
    bindingEpoch: number;
    eventRef: string;
  }): HelixReasoningSteeringEventProjection {
    const binding = this.requireActiveOwnedBinding(input);
    const index = this.events.findIndex((event) =>
      event.reasoning_binding_id === binding.reasoning_binding_id &&
      event.binding_epoch === binding.binding_epoch &&
      event.steering_event_ref === input.eventRef);
    if (index < 0) throw new HelixReasoningTaskBindingError("reasoning_steering_not_found", 404);
    const event = this.events[index];
    if (Date.parse(event.expires_at) <= this.now().getTime()) {
      throw new HelixReasoningTaskBindingError("reasoning_steering_expired", 409);
    }
    if (!event.acknowledged_at) {
      this.events[index] = {
        ...event,
        delivery_state: "acknowledged",
        acknowledged_at: this.now().toISOString(),
      };
    }
    return this.projectEvent(this.events[index]);
  }

  acknowledgeForTask(input: HelixReasoningTaskAssociation & { eventRef: string }): HelixReasoningSteeringEventProjection {
    this.verifyTaskAssociation(input);
    return this.acknowledge(input);
  }

  inspectEvent(input: {
    profileRef: string;
    bindingId: string;
    bindingEpoch: number;
    eventRef: string;
  }): HelixReasoningSteeringEventProjection {
    const binding = this.requireActiveOwnedBinding(input);
    const event = this.events.find((candidate) =>
      candidate.reasoning_binding_id === binding.reasoning_binding_id &&
      candidate.binding_epoch === binding.binding_epoch &&
      candidate.steering_event_ref === input.eventRef);
    if (!event) throw new HelixReasoningTaskBindingError("reasoning_steering_not_found", 404);
    const deliveryState = event.acknowledged_at
      ? "acknowledged" as const
      : Date.parse(event.expires_at) <= this.now().getTime()
        ? "expired" as const
        : event.delivery_state;
    return this.projectEvent({ ...event, delivery_state: deliveryState });
  }

  revoke(input: { profileRef: string; bindingId: string }): HelixReasoningTaskBindingProjection {
    const binding = this.currentBinding(input.bindingId);
    if (binding.authenticated_profile_ref !== input.profileRef) {
      throw new HelixReasoningTaskBindingError("reasoning_binding_identity_mismatch", 403);
    }
    if (["revoked", "expired", "superseded"].includes(binding.status)) return this.projectBinding(binding);
    const revoked = { ...binding, status: "revoked" as const, revoked_at: this.now().toISOString() };
    this.bindings.set(binding.reasoning_binding_id, revoked);
    return this.projectBinding(revoked);
  }

  inspect(input: { profileRef: string; bindingId: string }): HelixReasoningTaskBindingProjection {
    const binding = this.currentBinding(input.bindingId);
    if (binding.authenticated_profile_ref !== input.profileRef) {
      throw new HelixReasoningTaskBindingError("reasoning_binding_identity_mismatch", 403);
    }
    return this.projectBinding(binding);
  }

  /** Exact association preflight only. Does not admit an environment effect. */
  verifyTaskAssociation(input: HelixReasoningTaskAssociation): HelixReasoningTaskBindingProjection {
    const binding = this.requireActiveOwnedBinding(input);
    if (binding.service_instance_ref !== this.presence.serviceInstanceRef ||
        binding.authenticated_mcp_client_ref !== input.authenticatedMcpClientRef ||
        binding.provider_thread_ref_hash !== digest(input.clientContinuationRef) ||
        binding.helix_conversation_id !== input.helixConversationId ||
        binding.mission_id !== input.missionId || binding.run_id !== input.runId ||
        binding.continuation_transport !== "polling") {
      throw new HelixReasoningTaskBindingError("reasoning_binding_task_association_mismatch", 409);
    }
    const nowMs = this.now().getTime();
    const current = this.presence.listPresence().some(entry =>
      entry.active && entry.service_instance_ref === binding.service_instance_ref &&
      entry.authenticated_profile_ref === input.profileRef &&
      entry.authenticated_mcp_client_ref === input.authenticatedMcpClientRef &&
      entry.client_session_ref === input.clientSessionRef &&
      entry.conversation_thread_ref === input.clientContinuationRef &&
      Date.parse(entry.observed_at) <= nowMs && Date.parse(entry.heartbeat_expires_at) > nowMs &&
      (this.hasAcceptedPollingGrant(binding) || (
        entry.thread_observability_bridge?.requested_level === "continuation_ready" &&
        entry.thread_observability_bridge.supported_levels.includes("continuation_ready"))));
    if (!current) throw new HelixReasoningTaskBindingError("reasoning_binding_target_inactive", 409);
    return this.projectBinding(binding);
  }

  private hasAcceptedPollingGrant(binding: PrivateBinding): boolean {
    // Cached pairing metadata cannot supply admission. withAcceptedPairing must
    // have revalidated the durable grant for this exact synchronous operation.
    return Boolean(binding.durablePairingId) && this.admittedDurableBindings.has(binding.reasoning_binding_id);
  }

  /**
   * Internal owner-preparation target resolution, not provider authentication.
   * The route must authenticate profileRef as its browser actor independently.
   * Never expose the returned continuation through an HTTP projection or use it
   * to claim, pick up, acknowledge, or execute on behalf of the external task.
   */
  resolveOwnedPreparationTarget(input: {
    profileRef: string; bindingId: string; bindingEpoch: number;
    helixConversationId: string; missionId: string | null; runId: string | null;
  }) {
    const binding = this.requireActiveOwnedBinding(input);
    if (binding.helix_conversation_id !== input.helixConversationId ||
        binding.mission_id !== input.missionId || binding.run_id !== input.runId) {
      throw new HelixReasoningTaskBindingError("reasoning_binding_task_association_mismatch", 409);
    }
    const nowMs = this.now().getTime();
    const target = this.presence.listPresence().find(entry =>
      entry.active && entry.service_instance_ref === this.presence.serviceInstanceRef &&
      entry.authenticated_profile_ref === input.profileRef &&
      entry.authenticated_mcp_client_ref === binding.authenticated_mcp_client_ref &&
      entry.client_session_ref === binding.client_session_ref &&
      digest(entry.conversation_thread_ref) === binding.provider_thread_ref_hash &&
      Date.parse(entry.observed_at) <= nowMs && Date.parse(entry.heartbeat_expires_at) > nowMs &&
      (this.hasAcceptedPollingGrant(binding) || (
        entry.thread_observability_bridge?.requested_level === "continuation_ready" &&
        entry.thread_observability_bridge.supported_levels.includes("continuation_ready"))));
    if (!target?.authenticated_mcp_client_ref) {
      throw new HelixReasoningTaskBindingError("reasoning_binding_target_inactive", 409);
    }
    const association = { ...input,
      authenticatedMcpClientRef: target.authenticated_mcp_client_ref,
      clientSessionRef: target.client_session_ref,
      clientContinuationRef: target.conversation_thread_ref,
    };
    this.verifyTaskAssociation(association);
    return association;
  }

  inspectCurrent(input: {
    profileRef: string;
    helixConversationId: string;
  }): HelixReasoningTaskBindingProjection {
    const candidate = [...this.bindings.values()]
      .filter((binding) =>
        binding.authenticated_profile_ref === input.profileRef &&
        binding.helix_conversation_id === input.helixConversationId)
      .sort((left, right) => right.binding_epoch - left.binding_epoch)[0];
    if (!candidate) {
      throw new HelixReasoningTaskBindingError("reasoning_binding_not_found", 404);
    }
    return this.projectBinding(this.currentBinding(candidate.reasoning_binding_id));
  }

  inspectLatest(input: { profileRef: string }): HelixReasoningTaskBindingProjection {
    const candidate = [...this.bindings.values()]
      .filter((binding) => binding.authenticated_profile_ref === input.profileRef)
      .sort((left, right) => right.binding_epoch - left.binding_epoch)[0];
    if (!candidate) {
      throw new HelixReasoningTaskBindingError("reasoning_binding_not_found", 404);
    }
    return this.projectBinding(this.currentBinding(candidate.reasoning_binding_id));
  }

  private projectBinding(binding: PrivateBinding): HelixReasoningTaskBindingProjection {
    const { claimHandleHash: _private, durablePairingId: _durable, durableDestination: _destination, ...projection } = binding;
    return clone(helixReasoningTaskBindingProjectionSchema.parse({ ...projection,
      ...(_durable ? { pairing_id: _durable } : {}) }));
  }

  private projectEvent(event: PrivateEvent): HelixReasoningSteeringEventProjection {
    const { instructionText: _private, roomMission: _roomMission, ...projection } = event;
    return clone(helixReasoningSteeringEventProjectionSchema.parse(projection));
  }
}
