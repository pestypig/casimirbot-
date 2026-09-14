import { createNativePairingLedgerRepository, PairingStorageError, type PairingLedgerRepository } from "./pairing-ledger-repository";
import { BindingVerificationError, type BindingVerificationPhase } from "./binding-verification-error";
import { PairingDestinationRegistrationError } from "./pairing-destination-registration";
import { HelixLocalSupervisorCoordinationError } from "./local-supervisor-coordination";
import { HelixAgentApiServiceError } from "../helix-agent-api/errors";
import { acceptPairingLedgerRow, type PairingDestination } from "./pairing-ledger-contract";
import { DurableSteeringService } from "./durable-steering-service";
import { createNativeDurableSteeringRepository, type DurableSteeringRepository } from "./durable-steering-repository";
import { projectDurableSteering, deliverDurableSteering } from "./durable-steering-projection";
import type { HelixReasoningTaskBindingProjection } from "@shared/helix-reasoning-task-binding";
import { PairingTransitionService } from "./pairing-transition-service";
import { HelixReasoningTaskBindingError, type HelixReasoningTaskBindingStore } from "./reasoning-task-binding-store";
import type { ReasoningPreparationTargetStore } from "./reasoning-binding-ports";
import { dispatchAgentChatSteering, exactChatSteeringDispatchSchema, agentChatSteeringDispatchSchema } from "./exact-chat-steering-dispatch";

type Args<K extends keyof HelixReasoningTaskBindingStore> =
  HelixReasoningTaskBindingStore[K] extends (...args: infer A) => unknown ? A[0] : never;

/** Server-internal access layer. Public handlers still authenticate the browser
 * owner or exact MCP task and enforce origin, room, scopes and device trust.
 * Cached binding metadata selects a ledger row; it never supplies authority. */
export class DurableReasoningBindingAccess implements ReasoningPreparationTargetStore {
  private initializedRepository: Promise<PairingLedgerRepository> | undefined;

  private async verifyStep<T>(phase: BindingVerificationPhase, operation: () => Promise<T> | T): Promise<T> {
    try { return await operation(); }
    catch (error) {
      if (error instanceof BindingVerificationError || error instanceof HelixReasoningTaskBindingError ||
          error instanceof PairingStorageError || error instanceof PairingDestinationRegistrationError ||
          error instanceof HelixLocalSupervisorCoordinationError || error instanceof HelixAgentApiServiceError) throw error;
      throw new BindingVerificationError(phase, error);
    }
  }

  constructor(private readonly store: HelixReasoningTaskBindingStore,
    private readonly authorizeDestination: (destination: PairingDestination) => Promise<void>,
    private readonly repository: () => Promise<PairingLedgerRepository> = createNativePairingLedgerRepository,
    private readonly now: () => Date = () => new Date(),
    private readonly steeringRepository: () => Promise<DurableSteeringRepository> = createNativeDurableSteeringRepository) {}

  private ledgerRepository(): Promise<PairingLedgerRepository> {
    if (!this.initializedRepository) {
      const pending = Promise.resolve().then(() => this.repository());
      this.initializedRepository = pending;
      void pending.catch(() => {
        // Reject current callers; a later explicit call can initialize again.
        if (this.initializedRepository === pending) this.initializedRepository = undefined;
      });
    }
    return this.initializedRepository;
  }

  private async steering<T>(input: Args<"validateSteeringTarget">,
    operation: (service: DurableSteeringService, binding: () => HelixReasoningTaskBindingProjection) => Promise<T>) {
    const context = this.store.resolveDurableBindingContext(input);
    if (!context) throw new Error("steering_durable_context_required");
    let binding!: HelixReasoningTaskBindingProjection;
    const admit = async () => {
      binding = await this.use(input, () => this.store.validateSteeringTarget(input));
      const grant = await this.readGrant(input.profileRef, context.pairingId);
      acceptPairingLedgerRow(grant, context.destination, this.now());
      return grant;
    };
    await admit();
    const repository = await this.steeringRepository();
    return this.guarded(() => operation(new DurableSteeringService(repository, admit, this.now), () => binding));
  }

  private async guarded<T>(operation: () => Promise<T>): Promise<T> {
    try { return await operation(); }
    catch (error) {
      const code = error instanceof Error ? error.message : "";
      if (["pairing_destination_mismatch", "pairing_expired", "pairing_revoked", "pairing_superseded", "pairing_not_accepted"].includes(code)) {
        throw new HelixReasoningTaskBindingError(code, code === "pairing_destination_mismatch" ? 403 : 409);
      }
      if (code === "reasoning_steering_not_found") {
        throw new HelixReasoningTaskBindingError(code, 404);
      }
      if (["reasoning_steering_request_conflict", "reasoning_steering_expired"].includes(code)) {
        throw new HelixReasoningTaskBindingError(code, 409);
      }
      throw error;
    }
  }

  private async readGrant(profileId: string, id: string) {
    // Reuse only the repository handle for this access object's database
    // lifetime. Every admission still confirms durability and reads the row;
    // no grant, trust, identity or expiry verdict is retained here.
    const repository = await this.verifyStep("repository", () => this.ledgerRepository());
    await this.verifyStep("durability", () => repository.confirmDurability());
    const row = await this.verifyStep("record_read", () => repository.read(profileId, id));
    if (!row) throw new HelixReasoningTaskBindingError("pairing_not_found", 404);
    return row;
  }

  async restore(input: { destination: PairingDestination; clientSessionRef: string; pairingId: string }) {
    await this.authorizeDestination(input.destination);
    return this.guarded(() => this.store.withAcceptedPairing({ ...input,
      readAccepted: () => this.readGrant(input.destination.profileId, input.pairingId) }, binding => binding));
  }

  private async use<T>(input: { profileRef: string; bindingId: string }, operation: () => T): Promise<T> {
    const context = this.store.resolveDurableBindingContext(input);
    if (!context) return operation();
    await this.verifyStep("destination", () => this.authorizeDestination(context.destination));
    return this.verifyStep("accepted_record", () => this.guarded(() => this.store.withAcceptedPairing({ ...context,
      readAccepted: () => this.readGrant(input.profileRef, context.pairingId) }, binding => {
      if (binding.reasoning_binding_id !== input.bindingId) {
        throw new HelixReasoningTaskBindingError("reasoning_binding_identity_mismatch", 409);
      }
      return operation();
    })));
  }

  verifyTaskAssociation(input: Args<"verifyTaskAssociation">) {
    return this.use(input, () => this.store.verifyTaskAssociation(input));
  }
  async revokeOwned(input: Args<"revoke">, authorizeOwner: () => Promise<string>) {
    const owner = await authorizeOwner();
    if (owner !== input.profileRef) throw new HelixReasoningTaskBindingError("pairing_owner_mismatch", 403);
    const context = this.store.resolveDurableBindingContext(input);
    if (!context) return this.store.revoke(input);
    const repository = await this.ledgerRepository();
    const transitions = new PairingTransitionService(repository, {
      destination: async () => { throw new Error("pairing_destination_required"); },
      humanOwner: async () => owner,
    }, this.now);
    await transitions.revoke(undefined, context.pairingId);
    const row = await this.readGrant(owner, context.pairingId);
    return this.store.applyDurableRevocation(input, row);
  }
  resolveOwnedPreparationTarget(input: Args<"resolveOwnedPreparationTarget">) {
    return this.use(input, () => this.store.resolveOwnedPreparationTarget(input));
  }
  inspect(input: Args<"inspect">) { return this.use(input, () => this.store.inspect(input)); }
  inspectCurrent(input: Args<"inspectCurrent">) {
    return this.inspect({ profileRef: input.profileRef, bindingId: this.store.findOwnedBindingId(input) });
  }
  inspectLatest(input: Args<"inspectLatest">) {
    return this.inspect({ profileRef: input.profileRef, bindingId: this.store.findOwnedBindingId(input) });
  }
  dispatchExactPrompt(profileRef: string, request: unknown) {
    const body = exactChatSteeringDispatchSchema.parse(request);
    return this.dispatchExactValidated(profileRef, body);
  }
  private async dispatchExactValidated(profileRef: string, body: ReturnType<typeof exactChatSteeringDispatchSchema.parse>) {
    const binding = await this.inspectCurrent({ profileRef, helixConversationId: body.helix_conversation_id });
    if (binding.reasoning_binding_id !== body.reasoning_binding_id || binding.binding_epoch !== body.binding_epoch || binding.run_id !== body.run_id) {
      throw new HelixReasoningTaskBindingError("reasoning_binding_identity_mismatch", 409);
    }
    const event = await this.dispatch({ profileRef, bindingId: binding.reasoning_binding_id, bindingEpoch: binding.binding_epoch,
      clientEventRef: body.client_event_ref, origin: body.origin, instructionText: body.instruction_text, expiresInSeconds: body.expires_in_seconds });
    return { binding, event };
  }
  async dispatch(input: Args<"dispatch">) {
    if (!this.store.resolveDurableBindingContext(input)) return this.use(input, () => this.store.dispatch(input));
    return this.steering(input, async (service, binding) => projectDurableSteering(await service.submit({
      clientEventRef: input.clientEventRef, origin: input.origin, instructionText: input.instructionText,
      expiresInSeconds: input.expiresInSeconds }), binding(), this.now()));
  }
  dispatchAgentPrompt(actor: Parameters<typeof dispatchAgentChatSteering>[0], request: Parameters<typeof dispatchAgentChatSteering>[1]) {
    return this.dispatchAgentValidated(actor, request);
  }
  private async dispatchAgentValidated(actor: Parameters<typeof dispatchAgentChatSteering>[0], request: unknown) {
    const body = agentChatSteeringDispatchSchema.parse(request);
    await this.verifyTaskAssociation(actor);
    if (body.reasoning_binding_id !== actor.bindingId || body.binding_epoch !== actor.bindingEpoch ||
        body.helix_conversation_id !== actor.helixConversationId || body.run_id !== actor.runId) {
      throw new HelixReasoningTaskBindingError("reasoning_binding_identity_mismatch", 409);
    }
    const binding = await this.inspect({ profileRef: actor.profileRef, bindingId: actor.bindingId });
    const event = await this.dispatch({ profileRef: actor.profileRef, bindingId: actor.bindingId, bindingEpoch: actor.bindingEpoch,
      clientEventRef: body.client_event_ref, origin: "agent_submitted", instructionText: body.instruction_text, expiresInSeconds: body.expires_in_seconds });
    return { binding, event };
  }
  async read(input: Args<"read">) {
    if (!this.store.resolveDurableBindingContext(input)) return this.use(input, () => this.store.read(input));
    return this.steering(input, async (service, binding) => (await service.list(input.afterCursor)).map(row => deliverDurableSteering(row, binding(), this.now())));
  }
  async readForChatDisplay(input: Args<"readForChatDisplay">) {
    if (!this.store.resolveDurableBindingContext(input)) return this.use(input, () => this.store.readForChatDisplay(input));
    await this.use(input, () => this.store.readForChatDisplay(input));
    return this.steering(input, async (service, binding) => (await service.list(input.afterCursor, true)).map(row => deliverDurableSteering(row, binding(), this.now())));
  }
  async acknowledge(input: Args<"acknowledge">) {
    if (!this.store.resolveDurableBindingContext(input)) return this.use(input, () => this.store.acknowledge(input));
    return this.steering(input, async (service, binding) => projectDurableSteering(await service.acknowledge(input.eventRef), binding(), this.now()));
  }
  async inspectEvent(input: Args<"inspectEvent">) {
    if (!this.store.resolveDurableBindingContext(input)) return this.use(input, () => this.store.inspectEvent(input));
    return this.steering(input, async (service, binding) => projectDurableSteering(await service.inspect(input.eventRef), binding(), this.now()));
  }
}
