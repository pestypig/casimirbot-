import { pairingState, type PairingLedgerRow } from "./pairing-ledger-contract";
import { acknowledgeDurableSteering, createDurableSteering, replayDurableSteering,
  validateDurableSteering, type DurableSteeringRequest, type DurableSteeringRecord } from "./durable-steering-contract";
import type { DurableSteeringRepository } from "./durable-steering-repository";

// The adapter supplies fresh authenticated exact-destination admission. This
// class never infers consent or identity from a request or stored event.
export class DurableSteeringService {
  constructor(private readonly repository: DurableSteeringRepository,
    private readonly admit: () => Promise<PairingLedgerRow>,
    private readonly now: () => Date = () => new Date()) {}
  private async grant(expected?: PairingLedgerRow) {
    const grant = await this.admit();
    const state = pairingState(grant, this.now());
    if (state !== "accepted") throw new Error(`pairing_${state === "pending" ? "not_accepted" : state}`);
    if (expected && (grant.id !== expected.id || JSON.stringify(grant.approval) !== JSON.stringify(expected.approval))) {
      throw new Error("steering_scope_mismatch");
    }
    return grant;
  }
  private read(grant: PairingLedgerRow, id: string) {
    return this.repository.read(grant.approval.destination.profileId, grant.id, id);
  }
  private async confirmed(grant: PairingLedgerRow, row: DurableSteeringRecord) {
    await this.repository.confirmDurability();
    const current = await this.read(grant, row.id);
    if (!current) throw new Error("reasoning_steering_not_found");
    return validateDurableSteering(await this.grant(grant), current, this.now());
  }
  async submit(request: DurableSteeringRequest) {
    const original = await this.grant();
    // Compute deterministic lookup identity before attempting cursor allocation.
    const identity = createDurableSteering(original, request, 1, this.now());
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const grant = await this.grant(original);
      const prior = await this.read(grant, identity.id);
      if (prior) {
        replayDurableSteering(grant, prior, request, this.now());
        return replayDurableSteering(await this.grant(original), await this.confirmed(grant, prior), request, this.now());
      }
      const cursor = await this.repository.nextCursor(grant.approval.destination.profileId, grant.id);
      const row = createDurableSteering(await this.grant(original), request, cursor, this.now());
      if (await this.repository.insert(row)) return this.confirmed(grant, row);
    }
    throw new Error("steering_contention_retry_required");
  }
  async inspect(id: string) {
    const grant = await this.grant();
    const row = await this.read(grant, id);
    if (!row) throw new Error("reasoning_steering_not_found");
    return this.confirmed(grant, row);
  }
  async list(afterCursor = 0, recent = false) {
    const grant = await this.grant();
    await this.repository.confirmDurability();
    const rows = await this.repository.list(grant.approval.destination.profileId, grant.id, afterCursor, recent);
    const current = await this.grant(grant);
    return rows.map(row => validateDurableSteering(current, row, this.now()));
  }
  async acknowledge(id: string) {
    const original = await this.grant();
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const grant = await this.grant(original);
      const row = await this.read(grant, id);
      if (!row) throw new Error("reasoning_steering_not_found");
      const next = acknowledgeDurableSteering(grant, row, this.now());
      if (row.acknowledgedAt) return this.confirmed(grant, row);
      await this.grant(original);
      if (await this.repository.compareAndSwap(next, row.revision)) return this.confirmed(grant, next);
    }
    throw new Error("steering_contention_retry_required");
  }
}
