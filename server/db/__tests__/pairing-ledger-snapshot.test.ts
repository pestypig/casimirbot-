import { expect, it, vi } from "vitest";
import { mkdtempSync, readFileSync, unlinkSync, rmdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { PairingLedgerRepository, PAIRING_LEDGER_TABLE, createNativePairingLedgerRepository } from "../../services/local-supervisor/pairing-ledger-repository";
import { startDesktopProviderCredentialBroker } from "../../../apps/desktop/src/provider-credential-broker";
import { createPairingLedgerRow, pairingApprovalSchema, acceptPairingLedgerRow } from "../../services/local-supervisor/pairing-ledger-contract";
import { encryptProviderCredential, decryptProviderCredential } from "../../services/brokerage/provider-credential-vault";
import { PairingDestinationRegistrationStore, PAIRING_DESTINATIONS_TABLE } from "../../services/local-supervisor/pairing-destination-registration";

vi.mock("../../services/runtime/runtime-memory-governor", () => ({ scheduleRuntimeIdleMemorySettle: () => undefined }));

it("restores an encrypted accepted pairing from the real migrated snapshot after database reconstruction", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "casimir-pairing-snapshot-"));
  const snapshotPath = path.join(directory, "snapshot.json");
  vi.stubEnv("DATABASE_URL", "");
  vi.stubEnv("HELIX_LOCAL_DB_PATH", snapshotPath);
  vi.stubEnv("HELIX_LOCAL_PG_MEM_PERSIST", "1");
  vi.stubEnv("HELIX_LOCAL_PG_MEM_WRITE_MODE", "deferred");
  vi.stubEnv("HELIX_PROVIDER_CREDENTIAL_ENCRYPTION_KEY", randomBytes(32).toString("base64url"));
  const db = await import("../client");
  // Test-only codec uses an ephemeral key; the shipped native factory is not bypassed.
  const codec = {
    seal: async (value: unknown, aad: string) => encryptProviderCredential(value, aad),
    open: async (envelope: { encryptedValue: string }, aad: string) => decryptProviderCredential(envelope.encryptedValue, aad),
  };
  const repository = () => new PairingLedgerRepository(db.getPool(), codec,
    () => db.requireDurableDatabaseSnapshot([PAIRING_LEDGER_TABLE]));
  try {
    await db.ensureDatabase();
    await db.getPool().query("INSERT INTO helix_accounts(profile_id, display_name) VALUES ('fixture-owner', 'Fixture Owner')");
    // Persist the parent before the child, as account creation does in production.
    await db.requireDurableDatabaseSnapshot(["helix_accounts"]);
    const actor = { issuer: "fixture-provider", profileId: "fixture-owner", installationId: "fixture-install",
      clientId: "fixture-client", taskId: "fixture-private-task" };
    const approvedAt = new Date("2026-09-08T12:00:00Z");
    const registrations = () => new PairingDestinationRegistrationStore(db.getPool(),
      () => db.requireDurableDatabaseSnapshot([PAIRING_DESTINATIONS_TABLE]), () => approvedAt, codec);
    const registration = await registrations().registerAuthenticated(actor, { requestId: "fixture-disk-registration", durationSeconds: 900 });
    const original = createPairingLedgerRow({ id: "fixture-pairing", consentReceiptId: "fixture-consent",
      requestDigest: "a".repeat(64), acceptanceSecretDigest: "b".repeat(64),
      approval: pairingApprovalSchema.parse({ destination: actor, chatId: "fixture-chat", environment: null,
        scope: "exact_chat_steering", policyRevision: 1 }),
    }, approvedAt);
    const accepted = acceptPairingLedgerRow(original, actor, new Date(approvedAt.getTime() + 301000));
    await repository().insert(original);
    await repository().compareAndSwap(accepted, 1);
    const snapshot = readFileSync(snapshotPath, "utf8");
    expect(JSON.parse(snapshot).tables[PAIRING_LEDGER_TABLE]).toHaveLength(1);
    expect(snapshot).not.toContain(actor.taskId);
    expect(snapshot).not.toContain(original.acceptanceSecretDigest);
    await db.resetDbClient();
    await db.ensureDatabase();
    expect(await repository().read(actor.profileId, original.id)).toEqual(accepted);
    expect(await registrations().verifyAuthenticated(actor, registration.registrationId)).toEqual(registration);
    expect(await registrations().resolveOwned(actor.profileId, registration.registrationId)).toMatchObject({ destination: actor });
    await repository().confirmDurability();
  } finally {
    await db.resetDbClient();
    vi.unstubAllEnvs();
    try { unlinkSync(snapshotPath); } catch {}
    rmdirSync(directory);
  }
}, 60000);

it("uses the actual desktop broker and restores across database/broker restart and key rotation", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "casimir-pairing-native-"));
  const snapshotPath = path.join(directory, "snapshot.json");
  const firstKey = randomBytes(32).toString("base64url");
  let broker = await startDesktopProviderCredentialBroker({ keyring: { activeKey: firstKey, retiredKeys: [] } });
  const configureBroker = () => {
    vi.stubEnv("HELIX_PROVIDER_CREDENTIAL_BROKER_ORIGIN", broker.origin);
    vi.stubEnv("HELIX_PROVIDER_CREDENTIAL_BROKER_TOKEN", broker.token);
  };
  vi.stubEnv("DATABASE_URL", "");
  vi.stubEnv("HELIX_LOCAL_DB_PATH", snapshotPath);
  vi.stubEnv("HELIX_LOCAL_PG_MEM_PERSIST", "1");
  vi.stubEnv("HELIX_LOCAL_PG_MEM_WRITE_MODE", "deferred");
  vi.stubEnv("HELIX_PROVIDER_CREDENTIAL_ENCRYPTION_KEY", "");
  configureBroker();
  const db = await import("../client");
  try {
    let repository = await createNativePairingLedgerRepository();
    await db.getPool().query("INSERT INTO helix_accounts(profile_id, display_name) VALUES ('fixture-native-owner', 'Fixture Owner')");
    await db.requireDurableDatabaseSnapshot(["helix_accounts"]);
    const original = createPairingLedgerRow({ id: "fixture-native-pairing", consentReceiptId: "fixture-consent",
      requestDigest: "a".repeat(64), acceptanceSecretDigest: "b".repeat(64),
      approval: pairingApprovalSchema.parse({ destination: {
        issuer: "fixture-provider", profileId: "fixture-native-owner", installationId: "fixture-install",
        clientId: "fixture-client", taskId: "fixture-native-private-task" }, chatId: "fixture-chat",
        environment: null, scope: "exact_chat_steering", policyRevision: 1 }),
    }, new Date("2026-09-08T12:00:00Z"));
    expect(await repository.insert(original)).toBe(true);
    const stored = JSON.parse(readFileSync(snapshotPath, "utf8")).tables[PAIRING_LEDGER_TABLE][0];
    expect(stored.encrypted_payload).toMatch(/^v2:/u);
    expect(stored.encryption_key_id).toMatch(/^native:/u);
    expect(JSON.stringify(stored)).not.toContain(original.approval.destination.taskId);
    await db.resetDbClient();
    await broker.close();
    const nextKey = randomBytes(32).toString("base64url");
    broker = await startDesktopProviderCredentialBroker({ keyring: { activeKey: nextKey, retiredKeys: [firstKey] } });
    configureBroker();
    repository = await createNativePairingLedgerRepository();
    expect(await repository.read("fixture-native-owner", original.id)).toEqual(original);
    // Missing retired key must fail decryption; it cannot manufacture a new grant.
    await broker.close();
    broker = await startDesktopProviderCredentialBroker({ keyring: { activeKey: nextKey, retiredKeys: [] } });
    configureBroker();
    await expect(repository.read("fixture-native-owner", original.id)).rejects.toThrow();
    vi.stubEnv("HELIX_PROVIDER_CREDENTIAL_BROKER_TOKEN", randomBytes(32).toString("base64url"));
    await expect(repository.read("fixture-native-owner", original.id)).rejects.toThrow();
    expect((await db.getPool().query("SELECT * FROM helix_pairing_ledger")).rows).toHaveLength(1);
  } finally {
    await db.resetDbClient();
    await broker.close();
    vi.unstubAllEnvs();
    try { unlinkSync(snapshotPath); } catch {}
    rmdirSync(directory);
  }
}, 60000);

it("refuses a durability acknowledgement on a volatile-only database", async () => {
  vi.stubEnv("DATABASE_URL", "pg-mem://pairing-volatile-fixture");
  const db = await import("../client");
  try {
    await db.ensureDatabase();
    await expect(db.requireDurableDatabaseSnapshot([PAIRING_LEDGER_TABLE])).rejects.toThrow("durable_database_unavailable");
  } finally { await db.resetDbClient(); vi.unstubAllEnvs(); }
}, 60000);
