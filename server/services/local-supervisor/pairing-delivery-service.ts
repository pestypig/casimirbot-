import { PairingLedgerRepository } from "./pairing-ledger-repository";
import { PairingDeliveryRepository } from "./pairing-delivery-repository";
import { pairingDestinationDigest, pairingState, type PairingDestination } from "./pairing-ledger-contract";
import { beginPairingDelivery, confirmPairingDelivery, createPairingDelivery,
  requirePairingDeliveryScope } from "./pairing-delivery-contract";

/** A trusted adapter must authenticate this exact host/task and guarantee that
 * sendOnce is idempotent for deliveryId, including concurrent/lost-reply calls.
 * Merely accepting an idempotency string is not proof of that provider contract. */
export type AuthenticatedPairingDeliveryTarget = {
  destination: PairingDestination;
  lookup(deliveryId: string, signal: AbortSignal): Promise<{ state: "unknown" | "absent" } |
    { state: "delivered"; messageId: string }>;
  sendOnce(input: { deliveryId: string; invitation: { id: string; secret: string } }, signal: AbortSignal): Promise<{ messageId: string }>;
};

// One bounded transport operation, no model sampling, task creation or
// generic execution loop. No production adapter or route enables this service.
export class PairingDeliveryService<Credential> {
  constructor(private readonly pairings: PairingLedgerRepository,
    private readonly deliveries: PairingDeliveryRepository,
    private readonly authenticateOwner: (credential: Credential) => Promise<string>,
    private readonly connect: (credential: Credential, destination: PairingDestination, signal: AbortSignal) =>
      Promise<AuthenticatedPairingDeliveryTarget>,
    private readonly now: () => Date = () => new Date()) {}

  private async providerCall<T>(operation: (signal: AbortSignal) => Promise<T>): Promise<T> {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        Promise.resolve().then(() => operation(controller.signal)),
        new Promise<never>((_, reject) => { timer = setTimeout(() => {
          reject(new Error("pairing_delivery_provider_timeout"));
          controller.abort();
        }, 5000); }),
      ]);
    } finally { if (timer) clearTimeout(timer); }
  }

  async discoverPending(credential: Credential, afterId: string | null = null) {
    const owner = await this.authenticateOwner(credential);
    await this.pairings.confirmDurability();
    return this.pairings.pendingAutomaticDelivery(owner, afterId, this.now());
  }

  async verifyDestination(credential: Credential, destination: PairingDestination) {
    const owner = await this.authenticateOwner(credential);
    if (owner !== destination.profileId) throw new Error("pairing_delivery_provider_identity_mismatch");
    const target = await this.providerCall(signal => this.connect(credential, destination, signal));
    if (pairingDestinationDigest(target.destination) !== pairingDestinationDigest(destination)) {
      throw new Error("pairing_delivery_provider_identity_mismatch");
    }
  }

  async deliver(credential: Credential, pairingId: string) {
    const owner = await this.authenticateOwner(credential);
    const readPending = async () => {
      const pairing = await this.pairings.read(owner, pairingId);
      if (!pairing || pairing.approval.invitationDelivery !== "automatic" || pairingState(pairing, this.now()) !== "pending") {
        throw new Error("pairing_delivery_grant_unavailable");
      }
      return pairing;
    };
    let pairing = await readPending();
    const target = await this.providerCall(signal => this.connect(credential, pairing.approval.destination, signal));
    const targetDigest = pairingDestinationDigest(target.destination);
    const revalidate = async () => {
      const current = await readPending();
      if (pairingDestinationDigest(current.approval.destination) !== targetDigest) {
        throw new Error("pairing_delivery_provider_identity_mismatch");
      }
      return current;
    };
    pairing = await revalidate();
    let delivery = (await this.deliveries.insert(owner, createPairingDelivery(pairing, this.now()))).delivery;
    pairing = await revalidate();
    requirePairingDeliveryScope(delivery, pairing, this.now());
    if (delivery.state === "delivered") return delivery;
    if (delivery.state === "pending") {
      const unknown = beginPairingDelivery(delivery, pairing, this.now());
      if (!await this.deliveries.compareAndSwap(owner, unknown, delivery.revision)) {
        throw new Error("pairing_delivery_retry_reconciliation");
      }
      delivery = unknown;
    }
    // Unknown may mean a previous process sent successfully. Reconcile before
    // exposing the secret to the adapter or considering another send.
    const observed = await this.providerCall(signal => target.lookup(delivery.id, signal));
    pairing = await revalidate();
    requirePairingDeliveryScope(delivery, pairing, this.now());
    if (observed.state === "unknown") return delivery;
    let messageId: string;
    if (observed.state === "delivered") messageId = observed.messageId;
    else {
      if (!pairing.acceptanceSecret) throw new Error("pairing_invitation_copy_unavailable");
      // sendOnce must linearize concurrent attempts at the provider boundary.
      // Revocation during this await is rechecked below and by acceptance.
      messageId = (await this.providerCall(signal => target.sendOnce({ deliveryId: delivery.id,
        invitation: { id: pairing.id, secret: pairing.acceptanceSecret! } }, signal))).messageId;
    }
    pairing = await revalidate();
    const confirmed = confirmPairingDelivery(delivery, pairing, messageId, this.now());
    if (!await this.deliveries.compareAndSwap(owner, confirmed, delivery.revision)) {
      const current = await this.deliveries.read(owner, pairing.id);
      pairing = await revalidate();
      if (!current || current.state !== "delivered") throw new Error("pairing_delivery_retry_reconciliation");
      return confirmPairingDelivery(current, pairing, messageId, this.now());
    }
    await revalidate();
    return confirmed;
  }
}
