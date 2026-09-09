import { createNativePairingLedgerRepository, type PairingLedgerRepository } from "./pairing-ledger-repository";
import type { PairingDestination } from "./pairing-ledger-contract";
import { PairingTransitionService } from "./pairing-transition-service";
import { HelixReasoningTaskBindingError, type HelixReasoningTaskBindingStore } from "./reasoning-task-binding-store";
import type { ReasoningPreparationTargetStore } from "./reasoning-binding-ports";
import { dispatchAgentChatSteering, dispatchExactChatSteering, exactChatSteeringDispatchSchema } from "./exact-chat-steering-dispatch";

type Args<K extends keyof HelixReasoningTaskBindingStore> =
  HelixReasoningTaskBindingStore[K] extends (...args: infer A) => unknown ? A[0] : never;

/** Server-internal access layer. Public handlers still authenticate the browser
 * owner or exact MCP task and enforce origin, room, scopes and device trust.
 * Cached binding metadata selects a ledger row; it never supplies authority. */
export class DurableReasoningBindingAccess implements ReasoningPreparationTargetStore {
  constructor(private readonly store: HelixReasoningTaskBindingStore,
    private readonly authorizeDestination: (destination: PairingDestination) => Promise<void>,
    private readonly repository: () => Promise<PairingLedgerRepository> = createNativePairingLedgerRepository,
    private readonly now: () => Date = () => new Date()) {}

  private async guarded<T>(operation: () => Promise<T>): Promise<T> {
    try { return await operation(); }
    catch (error) {
      const code = error instanceof Error ? error.message : "";
      if (["pairing_destination_mismatch", "pairing_expired", "pairing_revoked", "pairing_not_accepted"].includes(code)) {
        throw new HelixReasoningTaskBindingError(code, code === "pairing_destination_mismatch" ? 403 : 409);
      }
      throw error;
    }
  }

  private async readGrant(profileId: string, id: string) {
    const repository = await this.repository();
    await repository.confirmDurability();
    const row = await repository.read(profileId, id);
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
    await this.authorizeDestination(context.destination);
    return this.guarded(() => this.store.withAcceptedPairing({ ...context,
      readAccepted: () => this.readGrant(input.profileRef, context.pairingId) }, binding => {
      if (binding.reasoning_binding_id !== input.bindingId) {
        throw new HelixReasoningTaskBindingError("reasoning_binding_identity_mismatch", 409);
      }
      return operation();
    }));
  }

  verifyTaskAssociation(input: Args<"verifyTaskAssociation">) {
    return this.use(input, () => this.store.verifyTaskAssociation(input));
  }
  async revokeOwned(input: Args<"revoke">, authorizeOwner: () => Promise<string>) {
    const owner = await authorizeOwner();
    if (owner !== input.profileRef) throw new HelixReasoningTaskBindingError("pairing_owner_mismatch", 403);
    const context = this.store.resolveDurableBindingContext(input);
    if (!context) return this.store.revoke(input);
    const repository = await this.repository();
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
    return this.use({ profileRef, bindingId: this.store.findOwnedBindingId({ profileRef, helixConversationId: body.helix_conversation_id }) },
      () => dispatchExactChatSteering(profileRef, body, this.store));
  }
  dispatch(input: Args<"dispatch">) { return this.use(input, () => this.store.dispatch(input)); }
  dispatchAgentPrompt(actor: Parameters<typeof dispatchAgentChatSteering>[0], request: Parameters<typeof dispatchAgentChatSteering>[1]) {
    return this.use(actor, () => dispatchAgentChatSteering(actor, request, this.store));
  }
  read(input: Args<"read">) { return this.use(input, () => this.store.read(input)); }
  readForChatDisplay(input: Args<"readForChatDisplay">) { return this.use(input, () => this.store.readForChatDisplay(input)); }
  acknowledge(input: Args<"acknowledge">) { return this.use(input, () => this.store.acknowledge(input)); }
  inspectEvent(input: Args<"inspectEvent">) { return this.use(input, () => this.store.inspectEvent(input)); }
}
