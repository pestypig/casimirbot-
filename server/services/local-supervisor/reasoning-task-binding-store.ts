import crypto from "node:crypto";
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

const digest = (value: string): string =>
  crypto.createHash("sha256").update(value, "utf8").digest("hex");
const clone = <T>(value: T): T => structuredClone(value);

type PresencePort = Readonly<{
  serviceInstanceRef: string;
  listPresence(): HelixLocalSupervisorPresence[];
}>;
type PrivateBinding = HelixReasoningTaskBindingProjection & {
  claimHandleHash: string;
};
type PrivateEvent = HelixReasoningSteeringEventProjection & {
  instructionText: string;
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

  constructor(
    private readonly presence: PresencePort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private currentBinding(bindingId: string): PrivateBinding {
    const binding = this.bindings.get(bindingId);
    if (!binding) throw new HelixReasoningTaskBindingError("reasoning_binding_not_found", 404);
    if (binding.status === "pending_claim" && Date.parse(binding.expires_at) <= this.now().getTime()) {
      const expired = { ...binding, status: "expired" as const };
      this.bindings.set(bindingId, expired);
      return expired;
    }
    return binding;
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
    for (const prior of existing) {
      this.bindings.set(prior.reasoning_binding_id, {
        ...prior,
        status: "superseded",
        revoked_at: this.now().toISOString(),
      });
    }
    const createdAt = this.now();
    const claimHandle = `reasoning_claim:${crypto.randomBytes(24).toString("base64url")}`;
    const bindingEpoch = ++this.bindingEpoch;
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

  dispatch(input: {
    profileRef: string;
    bindingId: string;
    bindingEpoch: number;
    clientEventRef: string;
    origin: "typed" | "gpt_live_finalized";
    instructionText: string;
    expiresInSeconds?: number;
  }): HelixReasoningSteeringEventProjection {
    const binding = this.requireActiveOwnedBinding(input);
    const instruction = input.instructionText.trim();
    if (!instruction || instruction.length > 4_000) {
      throw new HelixReasoningTaskBindingError("reasoning_steering_invalid_instruction", 400);
    }
    const dedupeKey = `${binding.reasoning_binding_id}\n${input.clientEventRef}`;
    const replayRef = this.eventDedupe.get(dedupeKey);
    if (replayRef) return this.projectEvent(this.events.find((event) => event.steering_event_ref === replayRef)!);
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
      expires_at: new Date(createdAt.getTime() + Math.min(3_600, Math.max(30, input.expiresInSeconds ?? 600)) * 1_000).toISOString(),
      acknowledged_at: null,
      advisory_only: true,
      execution_requested: false,
      evidence_satisfied: false,
      provider_thread_content_included: false,
      hidden_reasoning_included: false,
      answer_authority: false,
      terminal_eligible: false,
      instructionText: instruction,
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
    const nowMs = this.now().getTime();
    return this.events.filter((event) =>
      event.reasoning_binding_id === binding.reasoning_binding_id &&
      event.binding_epoch === binding.binding_epoch &&
      event.cursor > (input.afterCursor ?? 0))
      .slice(0, 50)
      .map((event) => ({
        event: this.projectEvent({
          ...event,
          delivery_state: event.acknowledged_at
            ? "acknowledged"
            : Date.parse(event.expires_at) <= nowMs ? "expired" : event.delivery_state,
        }),
        instruction_text: event.instructionText,
        content_role: "operator_steering_advisory_not_execution",
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
    const { claimHandleHash: _private, ...projection } = binding;
    return clone(helixReasoningTaskBindingProjectionSchema.parse(projection));
  }

  private projectEvent(event: PrivateEvent): HelixReasoningSteeringEventProjection {
    const { instructionText: _private, ...projection } = event;
    return clone(helixReasoningSteeringEventProjectionSchema.parse(projection));
  }
}
