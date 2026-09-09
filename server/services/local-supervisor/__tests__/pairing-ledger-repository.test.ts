import crypto from "node:crypto";
import { newDb } from "pg-mem";
import { afterEach, describe, expect, it, vi } from "vitest";
import { migration087 } from "../../../db/migrations/087_pairing_ledger";
import { PairingLedgerRepository, createNativePairingLedgerRepository } from "../pairing-ledger-repository";
import { createPairingLedgerRow, pairingApprovalSchema, acceptPairingLedgerRow, revokePairingLedgerRow } from "../pairing-ledger-contract";
import { PairingTransitionService } from "../pairing-transition-service";
import { PairingInvitationService } from "../pairing-invitation-service";

const pools: Array<{ end(): Promise<void> }> = [];
afterEach(async () => { await Promise.all(pools.splice(0).map(pool => pool.end())); vi.unstubAllEnvs(); });
const at = (seconds: number) => new Date(Date.parse("2026-09-08T12:00:00Z") + seconds * 1000);
const actor = { issuer: "fixture-issuer", profileId: "fixture-owner", installationId: "fixture-install",
  clientId: "fixture-client", taskId: "fixture-task" };
const row = (id = "fixture-pairing", requestDigest = "a".repeat(64)) => createPairingLedgerRow({
  id, approval: pairingApprovalSchema.parse({ destination: actor, chatId: "fixture-chat",
    environment: { roomId: "fixture-room", runId: "fixture-run" }, scope: "exact_chat_steering", policyRevision: 1 }),
  requestDigest, acceptanceSecretDigest: "b".repeat(64), consentReceiptId: "fixture-human-consent",
}, at(0));

describe("human-approved invitation issuance through encrypted persistence", () => {
  const request = { requestId: "fixture-issue-request", registrationId: "fixture-registration", chatId: "fixture-chat",
    environment: { roomId: "fixture-room", runId: "fixture-run" }, invitationSeconds: 900, pairingSeconds: 28800 };
  async function issuer() {
    const h = await fixture(); let seconds = 0;
    const authorize = vi.fn(async (credential: string) => {
      if (credential !== "fixture-human") throw new Error("fixture-human-required");
      return { approval: row().approval, consentReceiptId: "fixture-consent" };
    });
    return { ...h, authorize, time: (value: number) => { seconds = value; },
      service: new PairingInvitationService(h.repo, authorize, () => at(seconds)) };
  }
  it("issues once under concurrency and recovers the same copyable secret without renewal", async () => {
    const h = await issuer();
    const results = await Promise.all([h.service.issue("fixture-human", request), h.service.issue("fixture-human", request)]);
    expect(results[0]).toEqual(results[1]);
    expect(results[0].invitation?.secret).toMatch(/^[A-Za-z0-9_-]{43}$/u);
    const rows = (await h.pool.query("SELECT * FROM helix_pairing_ledger")).rows;
    expect(rows).toHaveLength(1);
    expect(JSON.stringify(rows)).not.toContain(results[0].invitation!.secret);
    h.time(301);
    expect(await h.service.issue("fixture-human", request)).toEqual(results[0]);
    expect(h.authorize).toHaveBeenCalledTimes(3);
    h.time(900);
    expect(await h.service.issue("fixture-human", request)).toMatchObject({ invitation: null, pairing: { state: "expired" } });
  });
  it("rejects non-human issuance and changed reviewed scope without replacing an existing invitation", async () => {
    const h = await issuer();
    await expect(h.service.issue("fixture-provider", request)).rejects.toThrow("fixture-human-required");
    const first = await h.service.issue("fixture-human", request);
    await expect(h.service.issue("fixture-human", { ...request, chatId: "fixture-foreign-chat" }))
      .rejects.toThrow("pairing_approval_scope_mismatch");
    h.authorize.mockResolvedValueOnce({ approval: { ...row().approval, pairingSeconds: 3600 }, consentReceiptId: "fixture-consent" });
    await expect(h.service.issue("fixture-human", { ...request, pairingSeconds: 3600 }))
      .rejects.toThrow("pairing_invitation_request_conflict");
    expect(await h.service.issue("fixture-human", request)).toEqual(first);
  });
  it("reconciles a lost durability reply and accepts the recovered secret exactly once", async () => {
    const h = await issuer();
    h.flush.mockRejectedValueOnce(new Error("fixture-disk-error"));
    await expect(h.service.issue("fixture-human", request)).rejects.toThrow("fixture-disk-error");
    const recovered = await h.service.issue("fixture-human", request);
    const transitions = new PairingTransitionService(h.repo, {
      destination: async () => actor, humanOwner: async () => actor.profileId,
    }, () => at(301));
    const accepted = await transitions.accept("fixture-provider", recovered.invitation);
    expect(accepted).toMatchObject({ state: "accepted", revision: 2 });
    expect((await h.repo.read(actor.profileId, accepted.id))?.acceptanceSecret).toBeNull();
    h.time(302);
    expect(await h.service.issue("fixture-human", request)).toMatchObject({ invitation: null, pairing: { state: "accepted", revision: 2 } });
    expect(JSON.stringify(accepted)).not.toContain(recovered.invitation!.secret);
  });
});

async function fixture() {
  const db = newDb();
  const pool = new (db.adapters.createPg().Pool)();
  pools.push(pool);
  await pool.query("CREATE TABLE helix_accounts (profile_id text PRIMARY KEY)");
  await pool.query("INSERT INTO helix_accounts VALUES ('fixture-owner')");
  const client = await pool.connect();
  try { await migration087.run(client, { enablePgvector: false }); }
  finally { client.release(); }
  // Real authenticated encryption with an ephemeral fixture key, never native credentials.
  const key = crypto.randomBytes(32);
  const codec = {
    async seal(value: unknown, aad: string) {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
      cipher.setAAD(Buffer.from(aad));
      const bytes = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
      return { keyId: "fixture-key", encryptedValue: JSON.stringify({ iv: iv.toString("hex"),
        tag: cipher.getAuthTag().toString("hex"), bytes: bytes.toString("hex") }) };
    },
    async open(envelope: { encryptedValue: string; keyId: string }, aad: string) {
      const data = JSON.parse(envelope.encryptedValue);
      const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(data.iv, "hex"));
      decipher.setAAD(Buffer.from(aad)); decipher.setAuthTag(Buffer.from(data.tag, "hex"));
      return JSON.parse(Buffer.concat([decipher.update(Buffer.from(data.bytes, "hex")), decipher.final()]).toString());
    },
  };
  const flush = vi.fn(async () => {});
  return { pool, codec, flush, repo: new PairingLedgerRepository(pool, codec, flush) };
}

describe("server-owned encrypted pairing repository", () => {
  it("reloads exact approved state through another repository without plaintext identity payload", async () => {
    const h = await fixture(); const original = row();
    expect(await h.repo.insert(original)).toBe(true);
    const stored = (await h.pool.query("SELECT * FROM helix_pairing_ledger")).rows[0];
    for (const secret of [actor.taskId, original.acceptanceSecretDigest, original.approval.chatId]) {
      expect(JSON.stringify(stored)).not.toContain(secret);
    }
    const reopened = new PairingLedgerRepository(h.pool, h.codec, h.flush);
    expect(await reopened.read(actor.profileId, original.id)).toEqual(original);
    expect(await reopened.read("foreign-owner", original.id)).toBeNull();
    expect(await reopened.readByRequest(actor.profileId, original.requestDigest)).toEqual(original);
  });
  it("deduplicates inserts and allows one concurrent transition per revision", async () => {
    const h = await fixture(); const original = row();
    const results = await Promise.all([h.repo.insert(original), h.repo.insert(original)]);
    expect(results.sort()).toEqual([false, true]);
    const accepted = acceptPairingLedgerRow(original, actor, at(301));
    const commits = await Promise.all([h.repo.compareAndSwap(accepted, 1), h.repo.compareAndSwap(accepted, 1)]);
    expect(commits.sort()).toEqual([false, true]);
    expect(await h.repo.read(actor.profileId, original.id)).toEqual(accepted);
    expect((await h.pool.query("SELECT * FROM helix_pairing_ledger")).rows).toHaveLength(1);
  });
  it("does not let stale acceptance overwrite a committed revocation", async () => {
    const h = await fixture(); const original = row(); await h.repo.insert(original);
    const revoked = revokePairingLedgerRow(original, actor.profileId, at(1));
    expect(await h.repo.compareAndSwap(revoked, 1)).toBe(true);
    expect(await h.repo.compareAndSwap(acceptPairingLedgerRow(original, actor, at(2)), 1)).toBe(false);
    expect(await h.repo.read(actor.profileId, original.id)).toEqual(revoked);
  });
  it("rejects copied ciphertext and revision tampering", async () => {
    const h = await fixture(); const first = row(); const second = row("fixture-second", "c".repeat(64));
    await h.repo.insert(first); await h.repo.insert(second);
    const payload = (await h.pool.query("SELECT encrypted_payload FROM helix_pairing_ledger WHERE pairing_id = $1", [first.id])).rows[0].encrypted_payload;
    await h.pool.query("UPDATE helix_pairing_ledger SET encrypted_payload = $1 WHERE pairing_id = $2", [payload, second.id]);
    await expect(h.repo.read(actor.profileId, second.id)).rejects.toThrow();
    await h.pool.query("UPDATE helix_pairing_ledger SET revision = 2 WHERE pairing_id = $1", [first.id]);
    await expect(h.repo.read(actor.profileId, first.id)).rejects.toThrow();
  });
  it("fails before a write if encryption fails and does not report success if flushing fails", async () => {
    const h = await fixture(); const original = row();
    const broken = new PairingLedgerRepository(h.pool, { ...h.codec, seal: async () => { throw new Error("fixture-key-unavailable"); } }, h.flush);
    await expect(broken.insert(original)).rejects.toThrow("fixture-key-unavailable");
    expect(await h.repo.read(actor.profileId, original.id)).toBeNull();
    h.flush.mockRejectedValueOnce(new Error("fixture-disk-unavailable"));
    await expect(h.repo.insert(original)).rejects.toThrow("fixture-disk-unavailable");
    // Commit outcome is unknown to caller. Retry reconciles, flushes, and creates nothing else.
    expect(await h.repo.insert(original)).toBe(false);
    expect(h.flush).toHaveBeenCalledTimes(2);
    expect(await h.repo.read(actor.profileId, original.id)).toEqual(original);
  });
  it("withholds the write result until the durability barrier resolves", async () => {
    const h = await fixture();
    let release!: () => void;
    let entered!: () => void;
    const reached = new Promise<void>(resolve => { entered = resolve; });
    const barrier = new Promise<void>(resolve => { release = resolve; });
    h.flush.mockImplementationOnce(async () => { entered(); await barrier; });
    let settled = false;
    const pending = h.repo.insert(row()).then(result => { settled = true; return result; });
    await reached;
    expect(settled).toBe(false);
    release();
    expect(await pending).toBe(true);
  });
  it("reconciles a transition whose durability reply failed without another revision", async () => {
    const h = await fixture(); const original = row(); await h.repo.insert(original);
    const accepted = acceptPairingLedgerRow(original, actor, at(1));
    h.flush.mockRejectedValueOnce(new Error("fixture-disk-unavailable"));
    await expect(h.repo.compareAndSwap(accepted, 1)).rejects.toThrow("fixture-disk-unavailable");
    const recovered = await h.repo.read(actor.profileId, original.id);
    expect(recovered).toEqual(accepted);
    await h.repo.confirmDurability();
    expect(await h.repo.compareAndSwap(accepted, 1)).toBe(false);
    expect((await h.repo.read(actor.profileId, original.id))?.revision).toBe(2);
  });
  it.each([
    ["", ""], ["http://127.0.0.1:1", ""], ["", "fixture-token"],
  ])("native factory refuses incomplete broker configuration (%s)", async (origin, token) => {
    vi.stubEnv("HELIX_PROVIDER_CREDENTIAL_BROKER_ORIGIN", origin);
    vi.stubEnv("HELIX_PROVIDER_CREDENTIAL_BROKER_TOKEN", token);
    await expect(createNativePairingLedgerRepository()).rejects.toThrow("pairing_native_broker_required");
  });
});

describe("pairing transition service with isolated authenticated identities", () => {
  async function serviceFixture() {
    const h = await fixture();
    const secret = crypto.randomBytes(32).toString("base64url");
    const original = { ...row(), acceptanceSecretDigest: crypto.createHash("sha256").update(secret).digest("hex") };
    await h.repo.insert(original);
    let seconds = 301;
    const authorization = {
      destination: vi.fn(async (credential: string) => {
        if (credential !== "fixture-provider-session") throw new Error("fixture-unauthenticated");
        return actor;
      }),
      humanOwner: vi.fn(async (credential: string) => {
        if (credential !== "fixture-human-session") throw new Error("fixture-human-required");
        return actor.profileId;
      }),
    };
    return { ...h, secret, original, authorization, time: (value: number) => { seconds = value; },
      service: new PairingTransitionService(h.repo, authorization, () => at(seconds)) };
  }
  it("accepts concurrently after idle, replays without renewal, and independently revokes", async () => {
    const h = await serviceFixture(); const input = { id: h.original.id, secret: h.secret };
    const results = await Promise.all([h.service.accept("fixture-provider-session", input),
      h.service.accept("fixture-provider-session", input)]);
    expect(results[0]).toEqual(results[1]);
    expect(results[0]).toMatchObject({ state: "accepted", revision: 2, executionAuthority: false });
    h.time(901);
    expect(await h.service.accept("fixture-provider-session", input)).toEqual(results[0]);
    expect(h.authorization.destination).toHaveBeenCalledTimes(3);
    const revoked = await h.service.revoke("fixture-human-session", h.original.id);
    expect(revoked).toMatchObject({ state: "revoked", revision: 3 });
    expect(await h.service.revoke("fixture-human-session", h.original.id)).toEqual(revoked);
    await expect(h.service.accept("fixture-provider-session", input)).rejects.toThrow("pairing_revoked");
  });
  it("rejects forged credentials, wrong secrets, wrong tasks and provider-origin revocation", async () => {
    const h = await serviceFixture(); const input = { id: h.original.id, secret: h.secret };
    await expect(h.service.accept("forged-session", input)).rejects.toThrow("fixture-unauthenticated");
    await expect(h.service.accept("fixture-provider-session", { ...input, secret: "x".repeat(43) })).rejects.toThrow("pairing_acceptance_invalid");
    h.authorization.destination.mockResolvedValueOnce({ ...actor, taskId: "fixture-foreign-task" });
    await expect(h.service.accept("fixture-provider-session", input)).rejects.toThrow("pairing_destination_mismatch");
    await expect(h.service.revoke("fixture-provider-session", input.id)).rejects.toThrow("fixture-human-required");
    expect((await h.repo.read(actor.profileId, input.id))?.revision).toBe(1);
  });
  it("reconciles acceptance after a failed durability reply and rejects expired acceptance", async () => {
    const h = await serviceFixture(); const input = { id: h.original.id, secret: h.secret };
    h.flush.mockRejectedValueOnce(new Error("fixture-disk-unavailable"));
    await expect(h.service.accept("fixture-provider-session", input)).rejects.toThrow("fixture-disk-unavailable");
    expect(await h.service.accept("fixture-provider-session", input)).toMatchObject({ state: "accepted", revision: 2 });
    h.time(28800);
    await expect(h.service.accept("fixture-provider-session", input)).rejects.toThrow("pairing_expired");
  });
  it("does not return accepted when revocation commits during replay reconciliation", async () => {
    const h = await serviceFixture(); const input = { id: h.original.id, secret: h.secret };
    await h.service.accept("fixture-provider-session", input);
    h.flush.mockImplementationOnce(async () => {
      await h.service.revoke("fixture-human-session", input.id);
    });
    await expect(h.service.accept("fixture-provider-session", input)).rejects.toThrow("pairing_revoked");
    expect((await h.repo.read(actor.profileId, input.id))?.revision).toBe(3);
  });
});
